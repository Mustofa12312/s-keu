import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:permission_handler/permission_handler.dart';
import '../utils/logger.dart';

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FirebaseMessaging _fcm = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();

  static const AndroidNotificationChannel _channel = AndroidNotificationChannel(
    'high_importance_channel', // id
    'High Importance Notifications', // title
    description: 'This channel is used for important notifications.', // description
    importance: Importance.high,
  );

  Future<void> initialize() async {
    try {
      // 1. Initialize Local Notifications for foreground display
      const AndroidInitializationSettings initSettingsAndroid = AndroidInitializationSettings('@mipmap/ic_launcher');
      const InitializationSettings initSettings = InitializationSettings(
        android: initSettingsAndroid,
      );
      await _localNotifications.initialize(settings: initSettings);

      // 2. Create the Android channel (needed for Heads Up notifications on Android 8+)
      await _localNotifications
          .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
          ?.createNotificationChannel(_channel);

      // 3. Configure FCM foreground message handler
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        logger.i('Received foreground message: ${message.notification?.title}');
        final notification = message.notification;
        final android = message.notification?.android;

        if (notification != null && android != null) {
          _localNotifications.show(
            id: notification.hashCode,
            title: notification.title,
            body: notification.body,
            notificationDetails: NotificationDetails(
              android: AndroidNotificationDetails(
                _channel.id,
                _channel.name,
                channelDescription: _channel.description,
                icon: '@mipmap/ic_launcher',
              ),
            ),
          );
        }
      });
      
      logger.i('NotificationService initialized successfully.');
    } catch (e, st) {
      logger.e('Failed to initialize NotificationService', error: e, stackTrace: st);
    }
  }

  Future<void> requestPermission() async {
    // Request notification permission (Especially needed for Android 13+)
    final status = await Permission.notification.request();
    if (status.isGranted) {
      logger.i('Notification permission granted.');
    } else {
      logger.w('Notification permission denied.');
    }
  }

  Future<String?> getToken() async {
    try {
      return await _fcm.getToken();
    } catch (e) {
      logger.e('Failed to get FCM token', error: e);
      return null;
    }
  }
}
