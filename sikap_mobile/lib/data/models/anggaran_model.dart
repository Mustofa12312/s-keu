class AnggaranModel {
  final String id;
  final String? instansiId;
  final String tahunPelajaran;
  final String kategori; // 'pendapatan' | 'belanja'
  final String kode;
  final String uraian;
  final String? waktuPelaksanaan;
  final String? pelaksana;
  final int volume;
  final String? satuan;
  final int hargaSatuan;
  final int jumlah;
  final Map<String, dynamic>? instansi;

  const AnggaranModel({
    required this.id,
    this.instansiId,
    required this.tahunPelajaran,
    required this.kategori,
    required this.kode,
    required this.uraian,
    this.waktuPelaksanaan,
    this.pelaksana,
    required this.volume,
    this.satuan,
    required this.hargaSatuan,
    required this.jumlah,
    this.instansi,
  });

  factory AnggaranModel.fromJson(Map<String, dynamic> json) {
    return AnggaranModel(
      id: json['id'] as String? ?? '',
      instansiId: json['instansi_id'] as String?,
      tahunPelajaran: json['tahun_pelajaran'] as String? ?? '',
      kategori: json['kategori'] as String? ?? '',
      kode: json['kode'] as String? ?? '',
      uraian: json['uraian'] as String? ?? '',
      waktuPelaksanaan: json['waktu_pelaksanaan'] as String?,
      pelaksana: json['pelaksana'] as String?,
      volume: (json['volume'] as num?)?.toInt() ?? 1,
      satuan: json['satuan'] as String?,
      hargaSatuan: (json['harga_satuan'] as num?)?.toInt() ?? 0,
      jumlah: (json['jumlah'] as num?)?.toInt() ?? 0,
      instansi: json['instansi'] as Map<String, dynamic>?,
    );
  }
}

class RealisasiAnggaranModel {
  final String id;
  final String anggaranId;
  final String? instansiId;
  final String tahunPelajaran;
  final String tanggal;
  final String keterangan;
  final int nominal;
  final Map<String, dynamic>? instansi;

  const RealisasiAnggaranModel({
    required this.id,
    required this.anggaranId,
    this.instansiId,
    required this.tahunPelajaran,
    required this.tanggal,
    required this.keterangan,
    required this.nominal,
    this.instansi,
  });

  factory RealisasiAnggaranModel.fromJson(Map<String, dynamic> json) {
    return RealisasiAnggaranModel(
      id: json['id'] as String? ?? '',
      anggaranId: json['anggaran_id'] as String? ?? '',
      instansiId: json['instansi_id'] as String?,
      tahunPelajaran: json['tahun_pelajaran'] as String? ?? '',
      tanggal: json['tanggal'] as String? ?? '',
      keterangan: json['keterangan'] as String? ?? '',
      nominal: (json['nominal'] as num?)?.toInt() ?? 0,
      instansi: json['instansi'] as Map<String, dynamic>?,
    );
  }
}
