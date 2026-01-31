import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/repositories/auth_repo.dart';

class AdminScreen extends ConsumerStatefulWidget {
  const AdminScreen({super.key});

  @override
  ConsumerState<AdminScreen> createState() => _AdminScreenState();
}

class _AdminScreenState extends ConsumerState<AdminScreen> {
  final _nameController = TextEditingController();
  final _usernameController = TextEditingController();
  String _role = 'admin';

  final List<_DemoUser> _users = [
    const _DemoUser(id: 'user-admin', name: 'Admin', username: 'admin', role: 'admin'),
    const _DemoUser(id: 'user-manager', name: 'Müdür', username: 'manager', role: 'manager'),
    const _DemoUser(id: 'user-staff', name: 'Personel', username: 'staff', role: 'staff'),
  ];

  @override
  void dispose() {
    _nameController.dispose();
    _usernameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final role = ref.watch(authRepoProvider).getRole();

    if (role != 'admin') {
      return const Center(child: Text('Bu sayfa sadece admin kullanıcılar içindir.'));
    }

    return Padding(
      padding: const EdgeInsets.all(12),
      child: ListView(
        children: [
          const Text('Admin Paneli', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
          const SizedBox(height: 4),
          const Text('Yetkilendirme, denetim ve üst düzey ayarlar burada yönetilir.',
              style: TextStyle(color: Colors.black54)),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Kullanıcı & Yetkilendirme', style: TextStyle(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 8),
                  const Text(
                    'Admin dışındaki kullanıcılar yetki yönetimini göremez veya düzenleyemez.',
                    style: TextStyle(fontSize: 12, color: Colors.black54),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _nameController,
                    decoration: const InputDecoration(labelText: 'Ad Soyad', border: OutlineInputBorder()),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _usernameController,
                    decoration: const InputDecoration(labelText: 'Kullanıcı adı', border: OutlineInputBorder()),
                  ),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    value: _role,
                    decoration: const InputDecoration(labelText: 'Rol', border: OutlineInputBorder()),
                    items: const [
                      DropdownMenuItem(value: 'admin', child: Text('Admin')),
                      DropdownMenuItem(value: 'manager', child: Text('Müdür')),
                      DropdownMenuItem(value: 'staff', child: Text('Personel')),
                    ],
                    onChanged: (value) => setState(() => _role = value ?? _role),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () {
                        final name = _nameController.text.trim();
                        final username = _usernameController.text.trim();
                        if (name.isEmpty || username.isEmpty) return;
                        setState(() {
                          _users.insert(
                            0,
                            _DemoUser(id: 'demo-${DateTime.now().millisecondsSinceEpoch}', name: name, username: username, role: _role),
                          );
                          _nameController.clear();
                          _usernameController.clear();
                          _role = 'admin';
                        });
                      },
                      child: const Text('Yetkili Ekle'),
                    ),
                  ),
                  const SizedBox(height: 12),
                  ..._users.map(
                    (user) => ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text(user.name),
                      subtitle: Text('@${user.username}'),
                      trailing: Wrap(
                        spacing: 8,
                        children: [
                          Chip(label: Text(_roleLabel(user.role))),
                          if (user.id != 'user-admin')
                            TextButton(
                              onPressed: () => setState(() => _users.removeWhere((u) => u.id == user.id)),
                              child: const Text('Yetkiyi Kaldır', style: TextStyle(color: Colors.red)),
                            ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

String _roleLabel(String role) {
  switch (role) {
    case 'admin':
      return 'Admin';
    case 'manager':
      return 'Müdür';
    case 'staff':
      return 'Personel';
    default:
      return role;
  }
}

class _DemoUser {
  const _DemoUser({required this.id, required this.name, required this.username, required this.role});
  final String id;
  final String name;
  final String username;
  final String role;
}
