import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/repositories/products_repo.dart';
import '../../data/repositories/auth_repo.dart';
import '../../data/models/models.dart';
import 'category_edit_screen.dart';
import 'product_edit_screen.dart';

final _pQuery = StateProvider<String>((ref) => '');
final _onlyCritical = StateProvider<bool>((ref) => false);
final _selectedCategory = StateProvider<String?>((ref) => null);

class ProductsScreen extends ConsumerWidget {
  const ProductsScreen({super.key});

  bool _canEdit(String role) => role == 'admin' || role == 'manager';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.watch(productsSeedProvider);
    final role = ref.watch(authRepoProvider).getRole();
    final query = ref.watch(_pQuery);
    final onlyCritical = ref.watch(_onlyCritical);
    final selectedCategory = ref.watch(_selectedCategory);

    final repo = ref.watch(productsRepoProvider);
    final products = repo.list(query: query, onlyCritical: onlyCritical, category: selectedCategory);
    final categories = repo.categories();

    return Padding(
      padding: const EdgeInsets.all(12),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: TextField(
                  decoration: const InputDecoration(prefixIcon: Icon(Icons.search), labelText: 'Ara'),
                  onChanged: (v) => ref.read(_pQuery.notifier).state = v,
                ),
              ),
              const SizedBox(width: 8),
              FilterChip(
                label: const Text('Kritik'),
                selected: onlyCritical,
                onSelected: (v) => ref.read(_onlyCritical.notifier).state = v,
              ),
              const SizedBox(width: 8),
              if (_canEdit(role))
                FilledButton.icon(
                  onPressed: () async {
                    final s = await Navigator.of(context).push<Product?>(
                      MaterialPageRoute(builder: (_) => ProductEditScreen(product: null)),
                    );
                    if (s != null) ref.invalidate(productsSeedProvider);
                  },
                  icon: const Icon(Icons.add),
                  label: const Text('Ürün'),
                ),
              if (_canEdit(role)) ...[
                const SizedBox(width: 8),
                FilledButton.icon(
                  onPressed: () async {
                    await Navigator.of(context).push<void>(
                      MaterialPageRoute(builder: (_) => const CategoryEditScreen()),
                    );
                    ref.invalidate(productsSeedProvider);
                  },
                  icon: const Icon(Icons.category),
                  label: const Text('Kategoriler'),
                ),
              ],
            ],
          ),
          const SizedBox(height: 8),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                FilterChip(
                  label: const Text('Tümü'),
                  selected: selectedCategory == null,
                  onSelected: (_) => ref.read(_selectedCategory.notifier).state = null,
                ),
                const SizedBox(width: 8),
                ...categories.map((c) => Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: FilterChip(
                        label: Text(c),
                        selected: selectedCategory == c,
                        onSelected: (_) => ref.read(_selectedCategory.notifier).state = c,
                      ),
                    )),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: ListView.separated(
              itemCount: products.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (context, i) {
                final p = products[i];
                final critical = p.stockQty <= p.criticalStock;
                final canEdit = _canEdit(role);
                return ListTile(
                  leading: Icon(critical ? Icons.warning_amber : Icons.inventory_2),
                  title: Text(p.name),
                  subtitle: Text('${p.category} • Stok: ${p.stockQty} • Satış: ₺${p.salePrice.toStringAsFixed(2)}'),
                  trailing: canEdit
                      ? IconButton(
                          icon: const Icon(Icons.edit),
                          tooltip: 'Ürünü düzenle',
                          onPressed: () async {
                            final s = await Navigator.of(context).push<Product?>(
                              MaterialPageRoute(builder: (_) => ProductEditScreen(product: p)),
                            );
                            if (s != null) ref.invalidate(productsSeedProvider);
                          },
                        )
                      : null,
                  onTap: !canEdit
                      ? null
                      : () async {
                          final s = await Navigator.of(context).push<Product?>(
                            MaterialPageRoute(builder: (_) => ProductEditScreen(product: p)),
                          );
                          if (s != null) ref.invalidate(productsSeedProvider);
                        },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
