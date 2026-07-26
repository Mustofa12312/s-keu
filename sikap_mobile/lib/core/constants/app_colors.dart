import 'package:flutter/material.dart';

class AppColors {
  // Primary Emerald Palette
  static const emerald50  = Color(0xFFECFDF5);
  static const emerald100 = Color(0xFFD1FAE5);
  static const emerald200 = Color(0xFFA7F3D0);
  static const emerald300 = Color(0xFF6EE7B7);
  static const emerald400 = Color(0xFF34D399);
  static const emerald500 = Color(0xFF10B981);
  static const emerald600 = Color(0xFF059669);
  static const emerald700 = Color(0xFF047857);
  static const emerald800 = Color(0xFF065F46);
  static const emerald900 = Color(0xFF064E3B);

  // Dark Surface Palette
  static const dark900 = Color(0xFF0F172A);
  static const dark800 = Color(0xFF1E293B);
  static const dark700 = Color(0xFF334155);
  static const dark600 = Color(0xFF475569);
  static const dark500 = Color(0xFF64748B);
  static const dark400 = Color(0xFF94A3B8);
  static const dark300 = Color(0xFFCBD5E1);
  static const dark200 = Color(0xFFE2E8F0);
  static const dark100 = Color(0xFFF1F5F9);
  static const dark50  = Color(0xFFF8FAFC);

  // Semantic Colors
  static const success   = Color(0xFF10B981);
  static const error     = Color(0xFFEF4444);
  static const warning   = Color(0xFFF59E0B);
  static const info      = Color(0xFF3B82F6);

  // Gradients
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [emerald400, emerald700],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient darkBgGradient = LinearGradient(
    colors: [dark900, Color(0xFF112240)],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  static const LinearGradient cardGradient = LinearGradient(
    colors: [Color(0xFF1E2D3D), Color(0xFF1A2744)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient incomeGradient = LinearGradient(
    colors: [Color(0xFF10B981), Color(0xFF059669)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient expenseGradient = LinearGradient(
    colors: [Color(0xFFEF4444), Color(0xFFB91C1C)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient balanceGradient = LinearGradient(
    colors: [Color(0xFF3B82F6), Color(0xFF1D4ED8)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}
