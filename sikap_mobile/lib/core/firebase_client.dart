import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';

class FirebaseClient {
  static Future<void> initialize() async {
    // firebase_options.dart is now generated via google-services.json
    // Android App ID: 1:180609665503:android:9dee952d98721e80311c6a
    try {
      await Firebase.initializeApp(
        options: const FirebaseOptions(
          apiKey: 'AIzaSyCxb-_z9W44SB37fke3lkHWp11m75o3pxU', // Android API Key from google-services.json
          appId: '1:180609665503:android:9dee952d98721e80311c6a', // Android App ID
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
