import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../local/hive_boxes.dart';

class AuthRepo extends ChangeNotifier {
  AuthRepo() {
    final box = HiveBoxes.box(HiveBoxes.users);
    _currentUserId = box.get('currentUserId')?['value'] as String?;
  }

  String? _currentUserId;
  String? get currentUserId => _currentUserId;
  bool get isLoggedIn => _currentUserId != null;

  Future<void> login({required String username, required String password}) async {
    // MVP: basit demo login
    // username: admin / manager / staff
    // password: 1234
    if (password != '1234') throw Exception('Şifre yanlış (demo: 1234)');
    if (!['admin', 'manager', 'staff'].contains(username)) {
      throw Exception('Kullanıcı bulunamadı (demo: admin/manager/staff)');
    }
    final box = HiveBoxes.box(HiveBoxes.users);
    final role = username == 'admin'
        ? 'admin'
        : username == 'manager'
            ? 'manager'
            : 'staff';

    _currentUserId = username;
    await box.put('currentUserId', {'value': _currentUserId});
    await box.put(_currentUserId!, {'id': _currentUserId, 'name': username, 'role': role});
    notifyListeners();
  }

  Future<void> logout() async {
    final box = HiveBoxes.box(HiveBoxes.users);
    await box.delete('currentUserId');
    _currentUserId = null;
    notifyListeners();
  }

  String getRole() {
    if (_currentUserId == null) return 'guest';
    final box = HiveBoxes.box(HiveBoxes.users);
    final u = box.get(_currentUserId!);
    return (u?['role'] ?? 'staff') as String;
  }
}

final authRepoProvider = ChangeNotifierProvider<AuthRepo>((ref) => AuthRepo());
