class KategoriModel {
  final String id;
  final String namaKategori;
  final String jenis; // 'pemasukan' | 'pengeluaran'

  const KategoriModel({
    required this.id,
    required this.namaKategori,
    required this.jenis,
  });

  factory KategoriModel.fromJson(Map<String, dynamic> json) {
    return KategoriModel(
      id: json['id'] as String? ?? '',
      namaKategori: json['nama_kategori'] as String? ?? '',
      jenis: json['jenis'] as String? ?? 'pengeluaran',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'nama_kategori': namaKategori,
      'jenis': jenis,
    };
  }
}
