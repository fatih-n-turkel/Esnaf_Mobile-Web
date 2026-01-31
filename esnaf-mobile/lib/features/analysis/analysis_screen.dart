import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/repositories/auth_repo.dart';
import '../../data/repositories/products_repo.dart';
import '../../data/repositories/sales_repo.dart';
import '../../data/models/models.dart';

class AnalysisScreen extends ConsumerStatefulWidget {
  const AnalysisScreen({super.key});

  @override
  ConsumerState<AnalysisScreen> createState() => _AnalysisScreenState();
}

class _AnalysisScreenState extends ConsumerState<AnalysisScreen> {
  String _query = '';

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authRepoProvider);
    final role = auth.getRole();
    final canSee = role == 'admin' || role == 'manager';

    if (!canSee) {
      return const Center(child: Text('Bu sayfa sadece admin ve müdür kullanıcılar içindir.'));
    }

    final salesRepo = ref.watch(salesRepoProvider);
    final products = ref.watch(productsRepoProvider).list();
    final sales = salesRepo.listRecent(limit: 500);
    final totalStock = products.fold<double>(0, (sum, p) => sum + p.stockQty);

    final personnel = auth.listUsers().where((u) => u.role == 'staff').toList();
    final filteredPersonnel = personnel
        .where((person) => _query.isEmpty || person.name.toLowerCase().contains(_query) || person.username.toLowerCase().contains(_query))
        .toList();

    return Padding(
      padding: const EdgeInsets.all(12),
      child: ListView(
        children: [
          const Text('Analiz', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
          const SizedBox(height: 4),
          const Text('Günlükten yıllığa satış, stok, kâr ve zarar analizi.', style: TextStyle(color: Colors.black54)),
          const SizedBox(height: 16),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: analyticsPeriods.map((period) {
              final summary = _calcSummary(salesRepo, sales, period);
              return SizedBox(
                width: 210,
                child: Card(
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(period.label, style: const TextStyle(fontWeight: FontWeight.w700)),
                        const SizedBox(height: 4),
                        Text('Son ${period.days} gün', style: const TextStyle(fontSize: 12, color: Colors.black54)),
                        const SizedBox(height: 8),
                        _Row(label: 'Ciro', value: _fmtMoney(summary.revenue)),
                        _Row(label: 'Satılan', value: '${summary.soldQty.toStringAsFixed(0)} adet'),
                        _Row(label: 'Stok', value: '${totalStock.toStringAsFixed(0)} adet'),
                        _Row(label: 'Kâr', value: _fmtMoney(summary.profit), valueColor: Colors.green),
                        _Row(label: 'Zarar', value: _fmtMoney(summary.loss), valueColor: Colors.red),
                      ],
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Personel Satışları & Performans', style: TextStyle(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 8),
                  TextField(
                    decoration: const InputDecoration(
                      prefixIcon: Icon(Icons.search),
                      labelText: 'Ara',
                      border: OutlineInputBorder(),
                    ),
                    onChanged: (value) => setState(() => _query = value.trim().toLowerCase()),
                  ),
                  const SizedBox(height: 12),
                  if (filteredPersonnel.isEmpty)
                    const Text('Personel bulunamadı.', style: TextStyle(fontSize: 12, color: Colors.black54)),
                  ...filteredPersonnel.map((person) {
                    final personSales = sales.where((sale) => sale.createdBy == person.username).toList();
                    final totalRevenue = personSales.fold<double>(0, (sum, sale) => sum + sale.totalGross);
                    final totalProfit = personSales.fold<double>(0, (sum, sale) => sum + sale.totalNetProfit);
                    final lastSaleAt = personSales.isEmpty
                        ? null
                        : DateTime.fromMillisecondsSinceEpoch(personSales.first.createdAt);

                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Card(
                        color: Colors.grey.shade50,
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(person.name, style: const TextStyle(fontWeight: FontWeight.w700)),
                                      Text('@${person.username}', style: const TextStyle(fontSize: 12, color: Colors.black54)),
                                    ],
                                  ),
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      Text('Toplam satış: ${personSales.length}',
                                          style: const TextStyle(fontSize: 12, color: Colors.black54)),
                                      Text(
                                        'Son satış: ${lastSaleAt != null ? lastSaleAt.toLocal().toString().split(' ').first : '-'}',
                                        style: const TextStyle(fontSize: 12, color: Colors.black54),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Text('Ciro: ${_fmtMoney(totalRevenue)} • Net kâr: ${_fmtMoney(totalProfit)}',
                                  style: const TextStyle(fontSize: 12, color: Colors.black54)),
                              const SizedBox(height: 8),
                              Wrap(
                                spacing: 8,
                                runSpacing: 8,
                                children: analyticsPeriods.map((period) {
                                  final summary = _calcSummary(salesRepo, personSales, period);
                                  return SizedBox(
                                    width: 180,
                                    child: Card(
                                      child: Padding(
                                        padding: const EdgeInsets.all(8),
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(period.label, style: const TextStyle(fontWeight: FontWeight.w600)),
                                            const SizedBox(height: 4),
                                            Text('Ciro: ${_fmtMoney(summary.revenue)}',
                                                style: const TextStyle(fontSize: 12, color: Colors.black54)),
                                            Text('Kâr: ${_fmtMoney(summary.profit)}',
                                                style: const TextStyle(fontSize: 12, color: Colors.black54)),
                                            Text('Zarar: ${_fmtMoney(summary.loss)}',
                                                style: const TextStyle(fontSize: 12, color: Colors.black54)),
                                            Text('Satış: ${summary.soldQty.toStringAsFixed(0)} adet',
                                                style: const TextStyle(fontSize: 12, color: Colors.black54)),
                                          ],
                                        ),
                                      ),
                                    ),
                                  );
                                }).toList(),
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  }),
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
                children: const [
                  Text('Dönemsel Raporlar', style: TextStyle(fontWeight: FontWeight.w700)),
                  SizedBox(height: 8),
                  _Bullet(text: 'Günlük / haftalık / aylık / yıllık / çeyrek dönem raporları'),
                  _Bullet(text: 'Ciro ve net kâr grafikleri'),
                  _Bullet(text: 'En çok satan ürünler'),
                  _Bullet(text: 'En çok kâr bırakan ürünler'),
                  _Bullet(text: 'Ödeme tipi dağılımı'),
                  _Bullet(text: 'Personel bazlı satış performansı'),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  Text('Maliyet & Gider Analizi', style: TextStyle(fontWeight: FontWeight.w700)),
                  SizedBox(height: 8),
                  _Bullet(text: 'Ürün bazlı maliyet takibi'),
                  _Bullet(text: 'Ödeme türüne göre giderler: Nakit, Kart (POS komisyonu / sabit gider)'),
                  _Bullet(text: 'Satış anında ve raporlarda: Satış geliri, ürün maliyeti, POS giderleri'),
                  _Bullet(text: 'Net kâr / zarar kırılımı'),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class AnalyticsPeriod {
  const AnalyticsPeriod({required this.key, required this.label, required this.days});
  final String key;
  final String label;
  final int days;
}

const analyticsPeriods = [
  AnalyticsPeriod(key: 'daily', label: 'Günlük', days: 1),
  AnalyticsPeriod(key: 'weekly', label: 'Haftalık', days: 7),
  AnalyticsPeriod(key: 'monthly', label: 'Aylık', days: 30),
  AnalyticsPeriod(key: 'quarterly', label: 'Çeyrek', days: 90),
  AnalyticsPeriod(key: 'yearly', label: 'Yıllık', days: 365),
];

class _Summary {
  const _Summary({required this.revenue, required this.profit, required this.loss, required this.soldQty});
  final double revenue;
  final double profit;
  final double loss;
  final double soldQty;
}

_Summary _calcSummary(SalesRepo repo, List<Sale> sales, AnalyticsPeriod period) {
  final now = DateTime.now();
  final startDay = DateTime(now.year, now.month, now.day).subtract(Duration(days: period.days - 1));

  double revenue = 0;
  double profit = 0;
  double loss = 0;
  double soldQty = 0;

  for (final sale in sales) {
    final created = DateTime.fromMillisecondsSinceEpoch(sale.createdAt);
    if (created.isBefore(startDay) || created.isAfter(now)) continue;
    revenue += sale.totalGross;
    profit += sale.totalNetProfit;
    if (sale.totalNetProfit < 0) loss += sale.totalNetProfit.abs();
    final items = repo.itemsOfSale(sale.id);
    soldQty += items.fold<double>(0, (sum, item) => sum + item.qty);
  }

  return _Summary(revenue: revenue, profit: profit, loss: loss, soldQty: soldQty);
}

String _fmtMoney(double value) => '₺${value.toStringAsFixed(2)}';

class _Row extends StatelessWidget {
  const _Row({required this.label, required this.value, this.valueColor});
  final String label;
  final String value;
  final Color? valueColor;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 12)),
          Text(value, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: valueColor)),
        ],
      ),
    );
  }
}

class _Bullet extends StatelessWidget {
  const _Bullet({required this.text});
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('• ', style: TextStyle(fontSize: 12)),
          Expanded(child: Text(text, style: const TextStyle(fontSize: 12, color: Colors.black54))),
        ],
      ),
    );
  }
}
