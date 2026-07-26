import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'dart:io';

void main() {
  test('Check Supabase Data', () async {
    await dotenv.load(fileName: '.env');
    final supabaseUrl = dotenv.env['SUPABASE_URL'] ?? '';
    final supabaseAnonKey = dotenv.env['SUPABASE_ANON_KEY'] ?? '';

    final client = SupabaseClient(supabaseUrl, supabaseAnonKey);

    try {
      final res = await client.from('transaksi').select('instansi_id, bulan_hijriyah, tahun_hijriyah, nominal, uraian').limit(20);
      print("Recent Transaksi: $res");
    } catch (e) {
      print("Error fetching transaksi: $e");
    }

    try {
      final resProfile = await client.from('profiles').select('id, nama, role, instansi_id').limit(2);
      print("Profiles: $resProfile");
    } catch (e) {
      print("Error fetching profiles: $e");
    }
  });
}
