import '../models/transaksi_model.dart';
import '../../core/supabase_client.dart';
import '../../core/utils/logger.dart';

class TransaksiRepository {
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
      var q = supabase
          .from('transaksi')
          .select('*, instansi:instansi_id(nama_instansi, kode_instansi)');

      if (instansiId != null && instansiId.isNotEmpty) {
        q = q.eq('instansi_id', instansiId);
      }
      if (bulanHijriyah != null && bulanHijriyah.isNotEmpty) {
        q = q.eq('bulan_hijriyah', bulanHijriyah);
      }
      if (tahunHijriyah != null && tahunHijriyah.isNotEmpty) {
        q = q.eq('tahun_hijriyah', tahunHijriyah);
      }
      if (search != null && search.isNotEmpty) {
        q = q.ilike('uraian', '%$search%');
      }
      if (tglMulai != null) q = q.gte('tanggal', tglMulai);
      if (tglAkhir != null) q = q.lte('tanggal', tglAkhir);

      final res = await q
          .order('tanggal', ascending: !orderDesc)
          .order('created_at', ascending: !orderDesc)
          .limit(limit);

      return (res as List).map((e) => TransaksiModel.fromJson(e)).toList();
    } catch (e, st) {
      logger.e('Error getAll transaksi', error: e, stackTrace: st);
      throw Exception('Gagal mengambil data transaksi');
    }
  }

  Future<TransaksiModel> create(Map<String, dynamic> payload) async {
    try {
      final res =
          await supabase.from('transaksi').insert(payload).select().single();
      return TransaksiModel.fromJson(res);
    } catch (e, st) {
      logger.e('Error create transaksi', error: e, stackTrace: st);
      throw Exception('Gagal menambah transaksi');
    }
  }

  Future<TransaksiModel> update(String id, Map<String, dynamic> payload) async {
    try {
      final res = await supabase
          .from('transaksi')
          .update({...payload, 'updated_at': DateTime.now().toIso8601String()})
          .eq('id', id)
          .select()
          .single();
      return TransaksiModel.fromJson(res);
    } catch (e, st) {
      logger.e('Error update transaksi $id', error: e, stackTrace: st);
      throw Exception('Gagal memperbarui transaksi');
    }
  }

  Future<void> delete(String id) async {
    try {
      await supabase.from('transaksi').delete().eq('id', id);
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
      var q = supabase
          .from('transaksi')
          .select('jenis, nominal, bulan_hijriyah, tahun_hijriyah');
      if (instansiId != null && instansiId.isNotEmpty) {
        q = q.eq('instansi_id', instansiId);
      }
      if (tahunHijriyah != null && tahunHijriyah.isNotEmpty) {
        q = q.eq('tahun_hijriyah', tahunHijriyah);
      }
      final res = await q;
      return (res as List).cast<Map<String, dynamic>>();
    } catch (e, st) {
      logger.e('Error getSummary transaksi', error: e, stackTrace: st);
      throw Exception('Gagal mengambil ringkasan transaksi');
    }
  }
}
