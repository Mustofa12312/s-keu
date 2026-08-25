class HutangPiutangModel {
  final String id;
  final String jenis; // 'hutang' | 'piutang'
  final String namaPihak;
  final int nominalTotal;
  final int nominalDibayar;
  final String status; // 'belum_lunas' | 'lunas'
  final String? tanggal;
  final String? tanggalHijriyah;
  final String? bulanHijriyah;
  final String? tahunHijriyah;
  final String? kodeTransaksi;
  final String? nomorBukti;
  final String? tanggalJatuhTempo;
  final String? keterangan;
  final String instansiId;
  final Map<String, dynamic>? instansi;
  final String? createdAt;

  const HutangPiutangModel({
    required this.id,
    required this.jenis,
    required this.namaPihak,
    required this.nominalTotal,
    required this.nominalDibayar,
    required this.status,
    this.tanggal,
    this.tanggalHijriyah,
    this.bulanHijriyah,
    this.tahunHijriyah,
    this.kodeTransaksi,
    this.nomorBukti,
    this.tanggalJatuhTempo,
    this.keterangan,
    required this.instansiId,
    this.instansi,
    this.createdAt,
  });

  factory HutangPiutangModel.fromJson(Map<String, dynamic> json) {
    return HutangPiutangModel(
      id: json['id'] as String? ?? '',
      jenis: json['jenis'] as String? ?? 'hutang',
      namaPihak: json['nama_pihak'] as String? ?? '',
      nominalTotal: (json['nominal_total'] as num?)?.toInt() ?? 0,
      nominalDibayar: (json['nominal_dibayar'] as num?)?.toInt() ?? 0,
      status: json['status'] as String? ?? 'belum_lunas',
      tanggal: json['tanggal'] as String?,
      tanggalHijriyah: json['tanggal_hijriyah'] as String?,
      bulanHijriyah: json['bulan_hijriyah'] as String?,
      tahunHijriyah: json['tahun_hijriyah'] as String?,
      kodeTransaksi: json['kode_transaksi'] as String?,
      nomorBukti: json['nomor_bukti'] as String?,
      tanggalJatuhTempo: json['tanggal_jatuh_tempo'] as String?,
      keterangan: json['keterangan'] as String?,
      instansiId: json['instansi_id'] as String? ?? '',
      instansi: json['instansi'] as Map<String, dynamic>?,
      createdAt: json['created_at']?.toString(),
    );
  }
}

class PembayaranHutangModel {
  final String id;
  final String hutangPiutangId;
  final int nominal;
  final String tanggal;
  final String keterangan;
  final String? createdAt;

  const PembayaranHutangModel({
    required this.id,
    required this.hutangPiutangId,
    required this.nominal,
    required this.tanggal,
    required this.keterangan,
    this.createdAt,
  });

  factory PembayaranHutangModel.fromJson(Map<String, dynamic> json) {
    return PembayaranHutangModel(
      id: json['id'] as String? ?? '',
      hutangPiutangId: json['hutang_piutang_id'] as String? ?? '',
      nominal: (json['nominal'] as num?)?.toInt() ?? 0,
      tanggal: json['tanggal'] as String? ?? '',
      keterangan: json['keterangan'] as String? ?? '',
      createdAt: json['created_at']?.toString(),
    );
  }
}
