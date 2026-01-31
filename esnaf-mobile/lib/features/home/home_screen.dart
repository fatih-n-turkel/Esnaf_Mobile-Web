import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../data/repositories/products_repo.dart';
import '../../data/repositories/sales_repo.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final seed = ref.watch(productsSeedProvider);

    return seed.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, st) => Center(child: Text('Seed error: $e')),
      data: (_) {
        final sales = ref.watch(salesRepoProvider).listRecent(limit: 10);
        final products = ref.watch(productsRepoProvider).list();
        final critical = products.where((p) => p.stockQty <= p.criticalStock).toList();

        return ListView(
          padding: const EdgeInsets.all(12),
          children: [
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: [
                _StatCard(title: 'Ürün', value: '${products.length}', icon: Icons.inventory_2),
                _StatCard(title: 'Kritik', value: '${critical.length}', icon: Icons.warning_amber),
                _StatCard(title: 'Son Satış', value: '${sales.length}', icon: Icons.receipt_long),
              ],
            ),
            const SizedBox(height: 16),
            Card(
              child: ListTile(
                leading: const Icon(Icons.point_of_sale),
                title: const Text('Hızlı Satış'),
                subtitle: const Text('3 tık: ürün seç → ödeme → tamamla'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () {
                  context.go('/sale');
                },
              ),
            ),
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Kritik Stok', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 8),
                    if (critical.isEmpty)
                      const Text('Şu an kritik stok yok ✅')
                    else
                      ...critical.take(6).map((p) => ListTile(
                            dense: true,
                            contentPadding: EdgeInsets.zero,
                            title: Text(p.name),
                            subtitle: Text('Stok: ${p.stockQty} (kritik: ${p.criticalStock})'),
                            leading: const Icon(Icons.error_outline),
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
                    const Text('Son Satışlar', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 8),
                    if (sales.isEmpty) const Text('Henüz satış yok'),
                    ...sales.map((s) => ListTile(
                          dense: true,
                          contentPadding: EdgeInsets.zero,
                          leading: const Icon(Icons.receipt),
                          title: Text(s.receiptNo),
                          subtitle: Text('Toplam: ${s.totalGross.toStringAsFixed(2)} • Kâr: ${s.totalNetProfit.toStringAsFixed(2)}'),
                        )),
                  ],
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}

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
                  Text(value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                ],
              )
            ],
          ),
        ),
      ),
    );
  }
}
