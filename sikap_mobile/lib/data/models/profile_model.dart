class ProfileModel {
  final String id;
  final String nama;
  final String? email;
  final String role; // 'super_admin' | 'admin_instansi' | 'viewer'
  final String? instansiId;
  final String? namaInstansi;
  final String? createdAt;

  const ProfileModel({
    required this.id,
    required this.nama,
    this.email,
    required this.role,
    this.instansiId,
    this.namaInstansi,
    this.createdAt,
  });

  bool get isSuperAdmin    => role == 'super_admin';
  bool get isAdminInstansi => role == 'admin_instansi';
  bool get isViewer        => role == 'viewer';

  String get roleLabel {
    switch (role) {
      case 'super_admin':    return 'Super Admin';
      case 'admin_instansi': return 'Admin Instansi';
      case 'viewer':         return 'Viewer';
      default:               return role;
    }
  }

  factory ProfileModel.fromJson(Map<String, dynamic> json) {
    final instansiMap = json['instansi'] as Map<String, dynamic>?;
    return ProfileModel(
      id:            json['id'] as String,
      nama:          json['nama'] as String,
      email:         json['email'] as String?,
      role:          json['role'] as String? ?? 'admin_instansi',
      instansiId:    json['instansi_id'] as String?,
      namaInstansi:  instansiMap?['nama_instansi'] as String?,
      createdAt:     json['created_at'] as String?,
    );
  }
}

class PengaturanModel {
  final String namaYayasan;
  final String alamatYayasan;
  final String ketuaYayasan;
  final String bendaharaPusat;
  final String tahunAktif;

  const PengaturanModel({
    required this.namaYayasan,
    required this.alamatYayasan,
    required this.ketuaYayasan,
    required this.bendaharaPusat,
    required this.tahunAktif,
  });

  factory PengaturanModel.fromJson(Map<String, dynamic> json) => PengaturanModel(
    namaYayasan:    json['nama_yayasan'] as String? ?? 'Pondok Pesantren Darur Rohman',
    alamatYayasan:  json['alamat_yayasan'] as String? ?? "Blu'uran, Karang Penang, Sampang",
    ketuaYayasan:   json['ketua_yayasan'] as String? ?? 'K. KHOIRUS SHOLEH',
    bendaharaPusat: json['bendahara_pusat'] as String? ?? '',
    tahunAktif:     json['tahun_aktif'] as String? ?? '1446',
  );

  factory PengaturanModel.defaultSettings() => const PengaturanModel(
    namaYayasan:    'Pondok Pesantren Darur Rohman',
    alamatYayasan:  "Blu'uran, Karang Penang, Sampang",
    ketuaYayasan:   'K. KHOIRUS SHOLEH',
    bendaharaPusat: '',
    tahunAktif:     '1446',
  );
}
