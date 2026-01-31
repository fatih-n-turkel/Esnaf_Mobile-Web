import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../local/hive_boxes.dart';
import 'branches_repo.dart';

class AuthRepo extends ChangeNotifier {
  AuthRepo() {
    final box = HiveBoxes.box(HiveBoxes.users);
    _seedUsers(box);
    _currentUserId = box.get('currentUserId')?['value'] as String?;
  }

  String? _currentUserId;
  String? get currentUserId => _currentUserId;
  bool get isLoggedIn => _currentUserId != null;

  static const _seedKey = 'users_initialized';

  final List<AuthUser> _defaultUsers = const [
    AuthUser(id: 'user-admin', name: 'Fatih', username: 'fatih', password: 'fatih', role: 'admin', branchId: ''),
    AuthUser(
      id: 'user-manager',
      name: 'Mehmet',
      username: 'mehmet',
      password: 'mehmet',
      role: 'manager',
      branchId: defaultBranchMainId,
    ),
    AuthUser(
      id: 'user-staff',
      name: 'Cenk',
      username: 'cenk',
      password: 'cenk',
      role: 'staff',
      branchId: defaultBranchMainId,
    ),
  ];

  void _seedUsers(box) {
    if (box.get(_seedKey) != null) return;
    for (final user in _defaultUsers) {
      box.put(user.username, user.toMap());
    }
    box.put(_seedKey, {'value': true});
  }

  List<AuthUser> listUsers() {
    final box = HiveBoxes.box(HiveBoxes.users);
    final users = <AuthUser>[];
    for (final entry in box.values) {
      if (entry is Map && entry['username'] != null && entry['role'] != null) {
        users.add(AuthUser.fromMap(entry));
      }
    }
    users.sort((a, b) => a.name.compareTo(b.name));
    return users;
  }

  Future<void> login({required String username, required String password}) async {
    final box = HiveBoxes.box(HiveBoxes.users);
    final normalized = username.trim().toLowerCase();
    final userRaw = box.get(normalized);
    if (userRaw == null) {
      throw Exception('Kullanıcı bulunamadı (demo: fatih/mehmet/cenk)');
    }
    final user = AuthUser.fromMap(userRaw);
    if (user.password != password.trim()) {
      throw Exception('Şifre yanlış');
    }

    _currentUserId = user.username;
    await box.put('currentUserId', {'value': _currentUserId});
    await box.put(_currentUserId!, user.toMap());
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

  String getBranchId() {
    if (_currentUserId == null) return '';
    final box = HiveBoxes.box(HiveBoxes.users);
    final u = box.get(_currentUserId!);
    return (u?['branchId'] ?? '') as String;
  }

  Future<void> upsertUser({
    required String name,
    required String username,
    required String role,
    String? password,
    String? branchId,
  }) async {
    final box = HiveBoxes.box(HiveBoxes.users);
    final normalized = username.trim().toLowerCase();
    final existing = box.get(normalized);
    final data = AuthUser(
      id: existing?['id'] as String? ?? 'user-$normalized',
      name: name.trim(),
      username: normalized,
      password: password?.trim() ?? existing?['password'] as String? ?? '1234',
      role: role,
      branchId: branchId ?? existing?['branchId'] as String? ?? '',
    );
    await box.put(normalized, data.toMap());
    notifyListeners();
  }

  Future<void> updateUserRole({required String username, required String role}) async {
    final box = HiveBoxes.box(HiveBoxes.users);
    final normalized = username.trim().toLowerCase();
    final existing = box.get(normalized);
    if (existing == null) return;
    await box.put(normalized, {...existing, 'role': role});
    notifyListeners();
  }

  Future<void> removeUser(String username) async {
    final box = HiveBoxes.box(HiveBoxes.users);
    await box.delete(username.trim().toLowerCase());
    notifyListeners();
  }
}

final authRepoProvider = ChangeNotifierProvider<AuthRepo>((ref) => AuthRepo());

class AuthUser {
  const AuthUser({
    required this.id,
    required this.name,
    required this.username,
    required this.password,
    required this.role,
    required this.branchId,
  });
  final String id;
  final String name;
  final String username;
  final String password;
  final String role;
  final String branchId;

  Map<String, dynamic> toMap() => {
        'id': id,
        'name': name,
        'username': username,
        'password': password,
        'role': role,
        'branchId': branchId,
      };

  factory AuthUser.fromMap(Map m) => AuthUser(
        id: (m['id'] ?? '') as String,
        name: (m['name'] ?? '') as String,
        username: (m['username'] ?? '') as String,
        password: (m['password'] ?? '') as String,
        role: (m['role'] ?? 'staff') as String,
        branchId: (m['branchId'] ?? '') as String,
      );
}
