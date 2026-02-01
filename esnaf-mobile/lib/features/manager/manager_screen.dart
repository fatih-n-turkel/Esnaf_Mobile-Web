import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/repositories/auth_repo.dart';
import '../../data/repositories/branches_repo.dart';
import '../../data/repositories/sales_repo.dart';
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
    final businessId = auth.getBusinessId();
    final salesRepo = ref.watch(salesRepoProvider);

    ref.watch(branchesSeedProvider);
    final branches = ref.watch(branchesRepoProvider).list(businessId: businessId);

    if (role != 'manager') {
      return const Center(child: Text('Bu sayfa sadece müdür kullanıcılar içindir.'));
    }

    final branch = branches.where((b) => b.id == branchId).toList();
    final branchLabel = branch.isEmpty ? 'Bilinmeyen bayi' : branch.first.name;
    final personnel = auth
        .listUsers()
        .where((u) => u.role == 'staff' && u.branchId == branchId && u.businessId == businessId)
        .toList();

    final sales =
        salesRepo.listRecent(limit: 300, businessId: businessId).where((s) => s.branchId == branchId).toList();
    final ownSales = sales.where((s) => s.createdBy == auth.currentUserId).toList();
    final ownRevenue = ownSales.fold<double>(0, (sum, s) => sum + s.totalGross);
    final ownProfit = ownSales.fold<double>(0, (sum, s) => sum + s.totalNetProfit);
    final managedRevenue = sales.fold<double>(0, (sum, s) => sum + s.totalGross);
    final managedProfit = sales.fold<double>(0, (sum, s) => sum + s.totalNetProfit);

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
                  const Text('Müdür Özeti', style: TextStyle(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 12,
                    runSpacing: 12,
                    children: [
                      _StatCard(title: 'Kendi Satış', value: '${ownSales.length}', icon: Icons.receipt_long),
                      _StatCard(title: 'Ciro (Kendi)', value: _fmtMoney(ownRevenue), icon: Icons.payments_outlined),
                      _StatCard(title: 'Kâr (Kendi)', value: _fmtMoney(ownProfit), icon: Icons.trending_up),
                      _StatCard(title: 'Ciro (Bayi)', value: _fmtMoney(managedRevenue), icon: Icons.store),
                      _StatCard(title: 'Kâr (Bayi)', value: _fmtMoney(managedProfit), icon: Icons.show_chart),
                    ],
                  ),
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
                            managerId: auth.currentUserId,
                            businessId: businessId,
                            businessName: auth.getBusinessName(),
                          );
                        } else {
                          auth.upsertUser(
                            name: name,
                            username: username,
                            role: 'staff',
                            branchId: _branchId,
                            password: '1234',
                            managerId: auth.currentUserId,
                            businessId: businessId,
                            businessName: auth.getBusinessName(),
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

String _fmtMoney(double value) => '₺${value.toStringAsFixed(2)}';

class _StatCard extends StatelessWidget {
  const _StatCard({required this.title, required this.value, required this.icon});
  final String title;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 160,
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              Icon(icon),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontSize: 12)),
                  Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                ],
              )
            ],
          ),
        ),
      ),
    );
  }
}
