import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/repositories/auth_repo.dart';
import '../../data/repositories/branches_repo.dart';
import '../../data/models/models.dart';

class ManagerScreen extends ConsumerStatefulWidget {
  const ManagerScreen({super.key});

  @override
  ConsumerState<ManagerScreen> createState() => _ManagerScreenState();
}

class _ManagerScreenState extends ConsumerState<ManagerScreen> {
  final _nameController = TextEditingController();
  final _usernameController = TextEditingController();
  String _branchId = '';
  String? _editingUsername;

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
    final branchId = auth.getBranchId();

    ref.watch(branchesSeedProvider);
    final branches = ref.watch(branchesRepoProvider).list();

    if (role != 'manager') {
      return const Center(child: Text('Bu sayfa sadece müdür kullanıcılar içindir.'));
    }

    final branch = branches.where((b) => b.id == branchId).toList();
    final branchLabel = branch.isEmpty ? 'Bilinmeyen bayi' : branch.first.name;
    final personnel = auth
        .listUsers()
        .where((u) => u.role == 'staff' && u.branchId == branchId)
        .toList();

    _branchId = _branchId.isEmpty ? branchId : _branchId;

    return Padding(
      padding: const EdgeInsets.all(12),
      child: ListView(
        children: [
          const Text('Müdür Sayfası', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
          const SizedBox(height: 4),
          Text('Operasyon özetleri, ekip yönetimi ve satış kontrolleri.',
              style: const TextStyle(color: Colors.black54)),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Personel Yönetimi • $branchLabel', style: const TextStyle(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 8),
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
                    value: _branchId,
                    decoration: const InputDecoration(labelText: 'Bayi', border: OutlineInputBorder()),
                    items: branches
                        .where((b) => b.id == branchId)
                        .map((b) => DropdownMenuItem(value: b.id, child: Text(b.name)))
                        .toList(),
                    onChanged: (value) => setState(() => _branchId = value ?? branchId),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () {
                        final name = _nameController.text.trim();
                        final username = _usernameController.text.trim();
                        if (name.isEmpty || username.isEmpty) return;
                        if (_editingUsername != null) {
                          auth.upsertUser(
                            name: name,
                            username: username,
                            role: 'staff',
                            branchId: _branchId,
                          );
                        } else {
                          auth.upsertUser(
                            name: name,
                            username: username,
                            role: 'staff',
                            branchId: _branchId,
                            password: '1234',
                          );
                        }
                        setState(() {
                          _nameController.clear();
                          _usernameController.clear();
                          _editingUsername = null;
                        });
                      },
                      child: Text(_editingUsername == null ? 'Personel Ekle' : 'Güncelle'),
                    ),
                  ),
                  const SizedBox(height: 12),
                  if (personnel.isEmpty)
                    const Text('Henüz personel yok.', style: TextStyle(color: Colors.black54)),
                  ...personnel.map(
                    (user) => ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text(user.name),
                      subtitle: Text('@${user.username}'),
                      trailing: Wrap(
                        spacing: 8,
                        children: [
                          TextButton(
                            onPressed: () {
                              setState(() {
                                _editingUsername = user.username;
                                _nameController.text = user.name;
                                _usernameController.text = user.username;
                                _branchId = user.branchId;
                              });
                            },
                            child: const Text('Düzenle'),
                          ),
                          TextButton(
                            onPressed: () => auth.removeUser(user.username),
                            child: const Text('Sil', style: TextStyle(color: Colors.red)),
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
