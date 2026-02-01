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

  static const businessBakkalId = 'biz-sen-bakkal';
  static const businessKasapId = 'biz-sen-kasap';

  final List<AuthUser> _defaultUsers = const [
    AuthUser(
      id: 'user-admin',
      name: 'Fatih',
      username: 'fatih',
      password: 'fatih',
      role: 'admin',
      branchId: '',
      businessId: businessBakkalId,
      businessName: 'Şen Bakkal',
    ),
    AuthUser(
      id: 'user-manager',
      name: 'Mehmet',
      username: 'mehmet',
      password: 'mehmet',
      role: 'manager',
      branchId: defaultBranchMainId,
      businessId: businessBakkalId,
      businessName: 'Şen Bakkal',
    ),
    AuthUser(
      id: 'user-staff',
      name: 'Cenk',
      username: 'cenk',
      password: 'cenk',
      role: 'staff',
      branchId: defaultBranchMainId,
      managerId: 'mehmet',
      businessId: businessBakkalId,
      businessName: 'Şen Bakkal',
    ),
    AuthUser(
      id: 'user-staff-2',
      name: 'Ahmet',
      username: 'ahmet',
      password: 'ahmet',
      role: 'staff',
      branchId: defaultBranchMainId,
      managerId: 'mehmet',
      businessId: businessBakkalId,
      businessName: 'Şen Bakkal',
    ),
    AuthUser(
      id: 'user-system',
      name: 'Esnaf Yönetim',
      username: 'yönetim',
      password: '1234',
      role: 'system',
      branchId: '',
      businessId: '',
      businessName: '',
    ),
    AuthUser(
      id: 'user-kasap-admin',
      name: 'Veli',
      username: 'veli',
      password: 'veli',
      role: 'admin',
      branchId: '',
      businessId: businessKasapId,
      businessName: 'Şen Kasap',
    ),
    AuthUser(
      id: 'user-kasap-staff',
      name: 'Taner',
      username: 'taner',
      password: 'taner',
      role: 'staff',
      branchId: defaultBranchKasapId,
      businessId: businessKasapId,
      businessName: 'Şen Kasap',
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

  Future<void> login({required String businessName, required String username, required String password}) async {
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
    if (user.role != 'system' && user.businessName.toLowerCase() != businessName.trim().toLowerCase()) {
      throw Exception('İşletme adı eşleşmedi');
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

  String getBusinessId() {
    if (_currentUserId == null) return '';
    final box = HiveBoxes.box(HiveBoxes.users);
    final u = box.get(_currentUserId!);
    return (u?['businessId'] ?? '') as String;
  }

  String getBusinessName() {
    if (_currentUserId == null) return '';
    final box = HiveBoxes.box(HiveBoxes.users);
    final u = box.get(_currentUserId!);
    return (u?['businessName'] ?? '') as String;
  }

  Future<void> upsertUser({
    required String name,
    required String username,
    required String role,
    String? password,
    String? branchId,
    String? managerId,
    String? businessId,
    String? businessName,
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
      managerId: role == 'staff' ? (managerId ?? existing?['managerId'] as String?) : null,
      businessId: businessId ?? existing?['businessId'] as String? ?? '',
      businessName: businessName ?? existing?['businessName'] as String? ?? '',
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

  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    if (_currentUserId == null) {
      throw Exception('Kullanıcı bulunamadı');
    }
    final box = HiveBoxes.box(HiveBoxes.users);
    final existing = box.get(_currentUserId!);
    if (existing == null) {
      throw Exception('Kullanıcı bulunamadı');
    }
    final storedPassword = (existing['password'] ?? '') as String;
    if (storedPassword != currentPassword.trim()) {
      throw Exception('Mevcut şifre hatalı');
    }
    await box.put(_currentUserId!, {...existing, 'password': newPassword.trim()});
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
    required this.businessId,
    required this.businessName,
    this.managerId,
  });
  final String id;
  final String name;
  final String username;
  final String password;
  final String role;
  final String branchId;
  final String businessId;
  final String businessName;
  final String? managerId;

  Map<String, dynamic> toMap() => {
        'id': id,
        'name': name,
        'username': username,
        'password': password,
        'role': role,
        'branchId': branchId,
        'businessId': businessId,
        'businessName': businessName,
        'managerId': managerId,
      };

  factory AuthUser.fromMap(Map m) => AuthUser(
        id: (m['id'] ?? '') as String,
        name: (m['name'] ?? '') as String,
        username: (m['username'] ?? '') as String,
        password: (m['password'] ?? '') as String,
        role: (m['role'] ?? 'staff') as String,
        branchId: (m['branchId'] ?? '') as String,
        businessId: (m['businessId'] ?? '') as String,
        businessName: (m['businessName'] ?? '') as String,
        managerId: m['managerId'] as String?,
      );
}
