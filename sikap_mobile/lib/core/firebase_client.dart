import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';

class FirebaseClient {
  static Future<void> initialize() async {
    // In a real scenario, you'd use flutterfire configure to generate firebase_options.dart.
    // For now we assume either firebase_options.dart is generated or we use env variables.
    
    try {
      await Firebase.initializeApp(
        options: const FirebaseOptions(
          apiKey: 'AIzaSyBGn2ALAU9DiiQoyyGjzpT_PhbCQCX5yTE',
          appId: '1:180609665503:web:f497638e1dbfaf3c311c6a', // Menggunakan Web App ID sementara untuk koneksi API
          messagingSenderId: '180609665503',
          projectId: 'fir-keu',
          storageBucket: 'fir-keu.firebasestorage.app',
        ),
      );
    } catch (e) {
      debugPrint('Firebase init error: $e');
    }
  }

  static FirebaseAuth get auth => FirebaseAuth.instance;
  static FirebaseFirestore get firestore => FirebaseFirestore.instance;
}
