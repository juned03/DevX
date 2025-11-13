import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

class AuthProvider extends ChangeNotifier {
  String role = dotenv.env['DEFAULT_ROLE'] ?? 'agent';
  bool isAuthenticated = true;

  void login(String newRole) {
    role = newRole; isAuthenticated = true; notifyListeners();
  }

  void logout() {
    role = 'guest'; isAuthenticated = false; notifyListeners();
  }
}


