import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

Future<void> main() async {
  await dotenv.load(fileName: ".env");
  final supabaseUrl = dotenv.env['SUPABASE_URL'] ?? '';
  final supabaseAnonKey = dotenv.env['SUPABASE_ANON_KEY'] ?? '';

  final supabase = SupabaseClient(supabaseUrl, supabaseAnonKey);

  try {
    final res = await supabase.from('transaksi').select('instansi_id, bulan_hijriyah, tahun_hijriyah, nominal, uraian').limit(5);
    print("Recent Transaksi: $res");
    
    final resProfile = await supabase.from('profiles').select('id, nama, role, instansi_id').limit(2);
    print("Profiles: $resProfile");

  } catch (e) {
    print("Error: $e");
  }
}
