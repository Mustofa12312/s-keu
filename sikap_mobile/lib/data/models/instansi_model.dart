class InstansiModel {
  final String id;
  final String namaInstansi;
  final String kodeInstansi;
  final String? alamat;
  final bool aktif;
  final String? createdAt;

  const InstansiModel({
    required this.id,
    required this.namaInstansi,
    required this.kodeInstansi,
    this.alamat,
    required this.aktif,
    this.createdAt,
  });

  factory InstansiModel.fromJson(Map<String, dynamic> json) => InstansiModel(
    id:            json['id'] as String,
    namaInstansi:  json['nama_instansi'] as String,
    kodeInstansi:  json['kode_instansi'] as String,
    alamat:        json['alamat'] as String?,
    aktif:         json['aktif'] as bool? ?? true,
    createdAt:     json['created_at'] as String?,
  );

  Map<String, dynamic> toJson() => {
    'nama_instansi': namaInstansi,
    'kode_instansi': kodeInstansi,
    'alamat':        alamat,
    'aktif':         aktif,
  };
}
