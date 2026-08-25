class LogAktivitasModel {
  final String id;
  final String userId;
  final String userNama;
  final String userRole;
  final String action;
  final String module;
  final String description;
  final String? createdAt;

  const LogAktivitasModel({
    required this.id,
    required this.userId,
    required this.userNama,
    required this.userRole,
    required this.action,
    required this.module,
    required this.description,
    this.createdAt,
  });

  factory LogAktivitasModel.fromJson(Map<String, dynamic> json) {
    return LogAktivitasModel(
      id: json['id'] as String? ?? '',
      userId: json['user_id'] as String? ?? '',
      userNama: json['user_nama'] as String? ?? '',
      userRole: json['user_role'] as String? ?? '',
      action: json['action'] as String? ?? '',
      module: json['module'] as String? ?? '',
      description: json['description'] as String? ?? '',
      createdAt: json['created_at']?.toString(),
    );
  }
}
