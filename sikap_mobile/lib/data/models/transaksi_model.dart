class TransaksiModel {
  final String id;
  final String? instansiId;
  final String? namaInstansi;
  final String? tanggal;
  final String? tanggalHijriyah;
  final String? bulanHijriyah;
  final String? tahunHijriyah;
  final String? kodeTransaksi;
  final String? nomorBukti;
  final String uraian;
  final String? sumberDana;
  final String jenis; // 'pemasukan' | 'pengeluaran'
  final int nominal;
  final String? createdAt;

  const TransaksiModel({
    required this.id,
    this.instansiId,
    this.namaInstansi,
    this.tanggal,
    this.tanggalHijriyah,
    this.bulanHijriyah,
    this.tahunHijriyah,
    this.kodeTransaksi,
    this.nomorBukti,
    required this.uraian,
    this.sumberDana,
    required this.jenis,
    required this.nominal,
    this.createdAt,
  });

  bool get isPemasukan => jenis == 'pemasukan';
  bool get isPengeluaran => jenis == 'pengeluaran';

  factory TransaksiModel.fromJson(Map<String, dynamic> json) {
    final instansiMap = json['instansi'] as Map<String, dynamic>?;
    return TransaksiModel(
      id:              json['id'] as String,
      instansiId:      json['instansi_id'] as String?,
      namaInstansi:    instansiMap?['nama_instansi'] as String?,
      tanggal:         json['tanggal'] as String?,
      tanggalHijriyah: json['tanggal_hijriyah'] as String?,
      bulanHijriyah:   json['bulan_hijriyah'] as String?,
      tahunHijriyah:   json['tahun_hijriyah'] as String?,
      kodeTransaksi:   json['kode_transaksi'] as String?,
      nomorBukti:      json['nomor_bukti'] as String?,
      uraian:          json['uraian'] as String,
      sumberDana:      json['sumber_dana'] as String?,
      jenis:           json['jenis'] as String,
      nominal:         (json['nominal'] as num).toInt(),
      createdAt:       json['created_at'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
    if (instansiId != null) 'instansi_id':      instansiId,
    if (tanggal != null) 'tanggal':             tanggal,
    if (tanggalHijriyah != null) 'tanggal_hijriyah': tanggalHijriyah,
    if (bulanHijriyah != null) 'bulan_hijriyah':bulanHijriyah,
    if (tahunHijriyah != null) 'tahun_hijriyah':tahunHijriyah,
    if (kodeTransaksi != null) 'kode_transaksi':kodeTransaksi,
    if (nomorBukti != null) 'nomor_bukti':      nomorBukti,
    'uraian':                                    uraian,
    if (sumberDana != null) 'sumber_dana':       sumberDana,
    'jenis':                                     jenis,
    'nominal':                                   nominal,
  };

  TransaksiModel copyWith({
    String? tanggal,
    String? tanggalHijriyah,
    String? bulanHijriyah,
    String? tahunHijriyah,
    String? kodeTransaksi,
    String? nomorBukti,
    String? uraian,
    String? sumberDana,
    String? jenis,
    int? nominal,
  }) => TransaksiModel(
    id: id,
    instansiId: instansiId,
    namaInstansi: namaInstansi,
    tanggal: tanggal ?? this.tanggal,
    tanggalHijriyah: tanggalHijriyah ?? this.tanggalHijriyah,
    bulanHijriyah: bulanHijriyah ?? this.bulanHijriyah,
    tahunHijriyah: tahunHijriyah ?? this.tahunHijriyah,
    kodeTransaksi: kodeTransaksi ?? this.kodeTransaksi,
    nomorBukti: nomorBukti ?? this.nomorBukti,
    uraian: uraian ?? this.uraian,
    sumberDana: sumberDana ?? this.sumberDana,
    jenis: jenis ?? this.jenis,
    nominal: nominal ?? this.nominal,
    createdAt: createdAt,
  );
}
