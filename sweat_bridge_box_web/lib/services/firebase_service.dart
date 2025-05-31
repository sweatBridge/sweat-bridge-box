import 'package:firebase_core/firebase_core.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class FirebaseService {
  static Future<void> initialize() async {
    await Firebase.initializeApp(
      options: const FirebaseOptions(
        apiKey: "AIzaSyDxOQxGQxGQxGQxGQxGQxGQxGQxGQxGQxGQ",
        authDomain: "sweat-bridge-box.firebaseapp.com",
        projectId: "sweat-bridge-box",
        storageBucket: "sweat-bridge-box.appspot.com",
        messagingSenderId: "123456789012",
        appId: "1:123456789012:web:1234567890123456789012"
      ),
    );
  }

  static FirebaseFirestore get firestore => FirebaseFirestore.instance;
} 