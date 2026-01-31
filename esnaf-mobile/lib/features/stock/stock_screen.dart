import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/repositories/products_repo.dart';
import '../../data/repositories/auth_repo.dart';
import '../../data/repositories/branches_repo.dart';
import '../../data/local/hive_boxes.dart';
import '../../data/models/models.dart';

class StockScreen extends ConsumerStatefulWidget {
  const StockScreen({super.key});

  @override
  ConsumerState<StockScreen> createState() => _StockScreenState();
}

class _StockScreenState extends ConsumerState<StockScreen> {
  String? selectedId;
  final qtyC = TextEditingController(text: '1');
  final reasonC = TextEditingController(text: 'stock_in');
  String _selectedBranchId = '';

  @override
  void dispose() {
    qtyC.dispose();
    reasonC.dispose();
    super.dispose();
  }

  double _d(String v) => double.tryParse(v.replaceAll(',', '.')) ?? 0.0;

  @override
  Widget build(BuildContext context) {
    ref.watch(productsSeedProvider);
    ref.watch(branchesSeedProvider);

    final repo = ref.watch(productsRepoProvider);
    final auth = ref.watch(authRepoProvider);
    final role = auth.getRole();
    final userBranchId = auth.getBranchId();
    final branches = ref.watch(branchesRepoProvider).list();
    final activeBranchId = role == 'admin' ? _selectedBranchId : userBranchId;
    final products = repo.list(branchId: activeBranchId);

    final movBox = HiveBoxes.box(HiveBoxes.stockMovements);
    final moves = movBox.values
        .map((m) => StockMovement.fromMap(m))
        .where((m) => activeBranchId.isEmpty || m.branchId == activeBranchId)
        .toList()
      ..sort((a, b) => b.createdAt.compareTo(a.createdAt));

    return Padding(
      padding: const EdgeInsets.all(12),
      child: Column(
        children: [
          if (role == 'admin')
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: DropdownButtonFormField<String>(
                value: _selectedBranchId,
                decoration: const InputDecoration(labelText: 'Bayi filtresi', border: OutlineInputBorder()),
                items: [
                  const DropdownMenuItem(value: '', child: Text('Tüm bayiler')),
                  ...branches.map((b) => DropdownMenuItem(value: b.id, child: Text(b.name))),
                ],
                onChanged: (value) => setState(() => _selectedBranchId = value ?? ''),
              ),
            ),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text('Stok Girişi / Düzeltme', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 10),
                  DropdownButtonFormField<String>(
                    value: selectedId,
                    items: products.map((p) => DropdownMenuItem(value: p.id, child: Text(p.name))).toList(),
                    onChanged: (v) => setState(() => selectedId = v),
                    decoration: const InputDecoration(labelText: 'Ürün seç'),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: qtyC,
                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                          decoration: const InputDecoration(labelText: 'Adet (+giriş, -düşüm)'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: TextField(
                          controller: reasonC,
                          decoration: const InputDecoration(labelText: 'Sebep'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  FilledButton.icon(
                    onPressed: selectedId == null
                        ? null
                        : () async {
                            final delta = _d(qtyC.text);
                            final reason = reasonC.text.trim();
                            final createdBy = ref.read(authRepoProvider).currentUserId ?? 'admin';
                            await repo.adjustStock(selectedId!, delta, branchId: activeBranchId);

                            final mov = StockMovement(
                              id: newId(),
                              productId: selectedId!,
                              type: delta >= 0 ? StockMoveType.inMove : StockMoveType.outMove,
                              qty: delta.abs(),
                              reason: reason,
                              createdAt: DateTime.now().millisecondsSinceEpoch,
                              createdBy: createdBy,
                              branchId: activeBranchId,
                            );
                            await movBox.put(mov.id, mov.toMap());
                            setState(() {});
                          },
                    icon: const Icon(Icons.add),
                    label: const Text('Kaydet'),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: Card(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Text('Stok Hareketleri', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 8),
                    Expanded(
                      child: ListView.separated(
                        itemCount: moves.length,
                        separatorBuilder: (_, __) => const Divider(height: 1),
                        itemBuilder: (context, i) {
                          final m = moves[i];
                          final p = repo.getById(m.productId);
                          final sign = m.type == StockMoveType.inMove ? '+' : '-';
                          final branchName = branches.where((b) => b.id == m.branchId).map((b) => b.name).toList();
                          return ListTile(
                            dense: true,
                            leading: Icon(m.type == StockMoveType.inMove ? Icons.add_circle_outline : Icons.remove_circle_outline),
                            title: Text(p?.name ?? m.productId),
                            subtitle: Text(
                              '${m.reason} • ${DateTime.fromMillisecondsSinceEpoch(m.createdAt)} • ${m.createdBy} • ${branchName.isNotEmpty ? branchName.first : m.branchId}',
                            ),
                            trailing: Text('$sign${m.qty}'),
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
