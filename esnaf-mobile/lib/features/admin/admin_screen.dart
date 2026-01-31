import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../data/repositories/auth_repo.dart';
import '../../data/repositories/branches_repo.dart';
import '../../data/models/models.dart';

class AdminScreen extends ConsumerStatefulWidget {
  const AdminScreen({super.key});

  @override
  ConsumerState<AdminScreen> createState() => _AdminScreenState();
}

class _AdminScreenState extends ConsumerState<AdminScreen> {
  final _nameController = TextEditingController();
  final _usernameController = TextEditingController();
  final _branchController = TextEditingController();
  String _role = 'staff';
  String _branchId = defaultBranchMainId;
  String _managerId = '';

  @override
  void dispose() {
    _nameController.dispose();
    _usernameController.dispose();
    _branchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authRepoProvider);
    ref.watch(branchesSeedProvider);
    final branchRepo = ref.watch(branchesRepoProvider);
    final branches = branchRepo.list();
    final role = auth.getRole();
    final users = auth.listUsers();
    final managers = users.where((u) => u.role == 'manager').toList();

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
            child: ListTile(
              leading: const Icon(Icons.analytics_outlined),
              title: const Text('Müdür Analizi'),
              subtitle: const Text('Performans, stok ve satış analizleri görün.'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => context.go('/analysis'),
            ),
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Bayi Yönetimi', style: TextStyle(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _branchController,
                    decoration: const InputDecoration(labelText: 'Bayi adı', border: OutlineInputBorder()),
                  ),
                  const SizedBox(height: 8),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () async {
                        final name = _branchController.text.trim();
                        if (name.isEmpty) return;
                        await branchRepo.addBranch(name);
                        setState(() => _branchController.clear());
                      },
                      child: const Text('Bayi Ekle'),
                    ),
                  ),
                  const SizedBox(height: 8),
                  if (branches.isEmpty) const Text('Henüz bayi yok.', style: TextStyle(color: Colors.black54)),
                  ...branches.map((branch) => ListTile(
                        contentPadding: EdgeInsets.zero,
                        title: Text(branch.name),
                        subtitle: Text('ID: ${branch.id}'),
                      )),
                ],
              ),
            ),
          ),
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
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    value: _role == 'admin'
                        ? ''
                        : (branches.any((branch) => branch.id == _branchId)
                            ? _branchId
                            : (branches.isNotEmpty ? branches.first.id : '')),
                    decoration: const InputDecoration(labelText: 'Bayi', border: OutlineInputBorder()),
                    items: [
                      const DropdownMenuItem(value: '', child: Text('Bayi yok')),
                      ...branches.map((branch) => DropdownMenuItem(value: branch.id, child: Text(branch.name))),
                    ],
                    onChanged: _role == 'admin' ? null : (value) => setState(() => _branchId = value ?? _branchId),
                  ),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    value: _role == 'staff' ? _managerId : '',
                    decoration: const InputDecoration(labelText: 'Müdür', border: OutlineInputBorder()),
                    items: [
                      const DropdownMenuItem(value: '', child: Text('Müdür seçin')),
                      ...managers.map((manager) => DropdownMenuItem(value: manager.username, child: Text(manager.name))),
                    ],
                    onChanged: _role == 'staff' ? (value) => setState(() => _managerId = value ?? '') : null,
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () {
                        final name = _nameController.text.trim();
                        final username = _usernameController.text.trim();
                        if (name.isEmpty || username.isEmpty) return;
                        auth.upsertUser(
                          name: name,
                          username: username,
                          role: _role,
                          password: '1234',
                          branchId: _role == 'admin' ? '' : _branchId,
                          managerId: _role == 'staff' ? _managerId : null,
                        );
                        setState(() {
                          _nameController.clear();
                          _usernameController.clear();
                          _role = 'staff';
                          _branchId = branches.isNotEmpty ? branches.first.id : defaultBranchMainId;
                          _managerId = '';
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
                      subtitle: Text(
                        '@${user.username} • ${_branchLabel(branches, user.branchId)}'
                        '${user.role == 'staff' && user.managerId != null ? ' • Müdür: ${_managerLabel(users, user.managerId!)}' : ''}',
                      ),
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
                          if (user.role == 'staff')
                            DropdownButton<String>(
                              value: user.managerId ?? '',
                              onChanged: (value) => auth.upsertUser(
                                name: user.name,
                                username: user.username,
                                role: user.role,
                                branchId: user.branchId,
                                managerId: value,
                              ),
                              items: [
                                const DropdownMenuItem(value: '', child: Text('Müdür seçin')),
                                ...managers.map((manager) =>
                                    DropdownMenuItem(value: manager.username, child: Text(manager.name))),
                              ],
                            ),
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

String _branchLabel(List<Branch> branches, String branchId) {
  if (branchId.isEmpty) return 'Bayi yok';
  final branch = branches.where((b) => b.id == branchId).toList();
  if (branch.isEmpty) return 'Bilinmeyen bayi';
  return branch.first.name;
}

String _managerLabel(List<AuthUser> users, String managerId) {
  final manager = users.where((u) => u.username == managerId || u.id == managerId).toList();
  if (manager.isEmpty) return 'Bilinmeyen müdür';
  return manager.first.name;
}
