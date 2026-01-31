import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../data/repositories/products_repo.dart';
import '../../data/repositories/sales_repo.dart';
import '../../data/repositories/auth_repo.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final seed = ref.watch(productsSeedProvider);

    return seed.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, st) => Center(child: Text('Seed error: $e')),
      data: (_) {
        final auth = ref.watch(authRepoProvider);
        final role = auth.getRole();
        final branchId = auth.getBranchId();
        final salesRepo = ref.watch(salesRepoProvider);
        final sales = salesRepo
            .listRecent(limit: 10)
            .where((s) => role == 'admin' || branchId.isEmpty || s.branchId == branchId)
            .toList();
        final salesAll = salesRepo
            .listRecent(limit: 200)
            .where((s) => role == 'admin' || branchId.isEmpty || s.branchId == branchId)
            .toList();
        final products = ref.watch(productsRepoProvider).list(branchId: branchId);
        final critical = products.where((p) => p.stockQty <= p.criticalStock).toList();
        final today = DateTime.now();
        final todaySales = salesAll.where((s) {
          final created = DateTime.fromMillisecondsSinceEpoch(s.createdAt);
          return created.year == today.year && created.month == today.month && created.day == today.day;
        }).toList();
        final todayRevenue = todaySales.fold<double>(0, (sum, s) => sum + s.totalGross);
        final todayProfit = todaySales.fold<double>(0, (sum, s) => sum + s.totalNetProfit);
        final todayVat = todaySales.fold<double>(0, (sum, s) => sum + s.totalVat);

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
            const SizedBox(height: 12),
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: [
                _StatCard(title: 'Ciro (Bugün)', value: _fmtMoney(todayRevenue), icon: Icons.payments_outlined),
                _StatCard(title: 'Kâr (Bugün)', value: _fmtMoney(todayProfit), icon: Icons.trending_up),
                _StatCard(title: 'KDV (Bugün)', value: _fmtMoney(todayVat), icon: Icons.receipt),
                _StatCard(title: 'Satış (Bugün)', value: '${todaySales.length}', icon: Icons.shopping_bag_outlined),
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
                    if (todaySales.isEmpty) const Text('Henüz satış yok'),
                    ...todaySales.map((s) {
                      final items = salesRepo.itemsOfSale(s.id);
                      final time = TimeOfDay.fromDateTime(DateTime.fromMillisecondsSinceEpoch(s.createdAt)).format(context);
                      return Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: Padding(
                          padding: const EdgeInsets.all(10),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Satış • $time', style: const TextStyle(fontWeight: FontWeight.w600)),
                              const SizedBox(height: 4),
                              Text('Satışı yapan: ${s.createdBy}', style: const TextStyle(color: Colors.black54)),
                              const SizedBox(height: 6),
                              if (items.isEmpty)
                                const Text('Ürün bilgisi yok')
                              else
                                ...items.map(
                                  (item) => Padding(
                                    padding: const EdgeInsets.only(bottom: 4),
                                    child: Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Expanded(
                                          child: Text(
                                            '${item.productName} x${item.qty.toStringAsFixed(0)}',
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        Text('₺${(item.qty * item.unitSalePrice).toStringAsFixed(2)}'),
                                      ],
                                    ),
                                  ),
                                ),
                              const Divider(height: 12),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text('Toplam', style: TextStyle(fontWeight: FontWeight.w600)),
                                  Text('₺${s.totalGross.toStringAsFixed(2)}',
                                      style: const TextStyle(fontWeight: FontWeight.w600)),
                                ],
                              ),
                            ],
                          ),
                        ),
                      );
                    }),
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
