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
  String _role = 'staff';

  @override
  void dispose() {
    _nameController.dispose();
    _usernameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authRepoProvider);
    final role = auth.getRole();
    final users = auth.listUsers();

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
                        auth.upsertUser(name: name, username: username, role: _role, password: '1234');
                        setState(() {
                          _nameController.clear();
                          _usernameController.clear();
                          _role = 'staff';
                        });
                      },
                      child: const Text('Yetkili Ekle'),
                    ),
                  ),
                  const SizedBox(height: 12),
                  ...users.map(
                    (user) => ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text(user.name),
                      subtitle: Text('@${user.username}'),
                      trailing: Wrap(
                        spacing: 8,
                        children: [
                          DropdownButton<String>(
                            value: user.role,
                            onChanged: user.username == 'fatih'
                                ? null
                                : (value) {
                                    if (value == null) return;
                                    auth.updateUserRole(username: user.username, role: value);
                                  },
                            items: const [
                              DropdownMenuItem(value: 'admin', child: Text('Admin')),
                              DropdownMenuItem(value: 'manager', child: Text('Müdür')),
                              DropdownMenuItem(value: 'staff', child: Text('Personel')),
                            ],
                          ),
                          Chip(label: Text(_roleLabel(user.role))),
                          if (user.username != 'fatih')
                            TextButton(
                              onPressed: () => auth.removeUser(user.username),
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
