import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/repositories/auth_repo.dart';
import '../../data/repositories/branches_repo.dart';
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
  String _selectedBranchId = '';
  String _branchSearch = '';

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authRepoProvider);
    final role = auth.getRole();
    final userBranchId = auth.getBranchId();
    final businessId = auth.getBusinessId();
    final canSee = role == 'admin' || role == 'manager';

    if (!canSee) {
      return const Center(child: Text('Bu sayfa sadece admin ve müdür kullanıcılar içindir.'));
    }

    ref.watch(branchesSeedProvider);
    final branches = ref.watch(branchesRepoProvider).list(businessId: businessId);
    final activeBranchId = role == 'admin' ? _selectedBranchId : userBranchId;
    final salesRepo = ref.watch(salesRepoProvider);
    final products = ref.watch(productsRepoProvider).list(branchId: activeBranchId, businessId: businessId);
    final sales = salesRepo.listRecent(limit: 500, businessId: businessId).where((sale) {
      if (activeBranchId.isEmpty) return true;
      return sale.branchId == activeBranchId;
    }).toList();
    final totalStock = products.fold<double>(0, (sum, p) => sum + p.stockQty);
    final financial = _financialSummary(sales);

    final personnel = auth
        .listUsers()
        .where((u) =>
            u.role == 'staff' &&
            u.businessId == businessId &&
            (activeBranchId.isEmpty || u.branchId == activeBranchId))
        .toList();
    final filteredPersonnel = personnel
        .where((person) => _query.isEmpty || person.name.toLowerCase().contains(_query) || person.username.toLowerCase().contains(_query))
        .toList();

    final managers = auth.listUsers().where((u) => u.role == 'manager' && u.businessId == businessId).toList();

    return Padding(
      padding: const EdgeInsets.all(12),
      child: ListView(
        children: [
          const Text('Analiz', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
          const SizedBox(height: 4),
          const Text('Günlükten yıllığa satış, stok, kâr ve zarar analizi.', style: TextStyle(color: Colors.black54)),
          if (role == 'admin') ...[
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: _selectedBranchId,
              decoration: const InputDecoration(labelText: 'Bayi filtresi', border: OutlineInputBorder()),
              items: [
                const DropdownMenuItem(value: '', child: Text('Tüm bayiler')),
                ...branches.map((b) => DropdownMenuItem(value: b.id, child: Text(b.name))),
              ],
              onChanged: (value) => setState(() => _selectedBranchId = value ?? ''),
            ),
          ],
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
                  const Text('Bayi Analizleri', style: TextStyle(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 8),
                  TextField(
                    decoration: const InputDecoration(
                      prefixIcon: Icon(Icons.search),
                      labelText: 'Bayi ara',
                      border: OutlineInputBorder(),
                    ),
                    onChanged: (value) => setState(() => _branchSearch = value.trim().toLowerCase()),
                  ),
                  const SizedBox(height: 12),
                  ...branches
                      .where((b) => activeBranchId.isEmpty || b.id == activeBranchId)
                      .where((b) => _branchSearch.isEmpty || b.name.toLowerCase().contains(_branchSearch))
                      .map((branch) {
                    final branchSales = salesRepo
                        .listRecent(limit: 500, businessId: businessId)
                        .where((sale) => sale.branchId == branch.id)
                        .toList();
                    final branchProducts =
                        ref.watch(productsRepoProvider).list(branchId: branch.id, businessId: businessId);
                    final branchStock = branchProducts.fold<double>(0, (sum, p) => sum + p.stockQty);
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Card(
                        color: Colors.grey.shade50,
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(branch.name, style: const TextStyle(fontWeight: FontWeight.w700)),
                              const SizedBox(height: 4),
                              Text('Toplam satış: ${branchSales.length} • Stok: ${branchStock.toStringAsFixed(0)}',
                                  style: const TextStyle(fontSize: 12, color: Colors.black54)),
                              const SizedBox(height: 4),
                              Text('Ciro: ${_fmtMoney(branchSales.fold<double>(0, (sum, s) => sum + s.totalGross))} • '
                                  'Kâr: ${_fmtMoney(branchSales.fold<double>(0, (sum, s) => sum + s.totalNetProfit))}',
                                  style: const TextStyle(fontSize: 12, color: Colors.black54)),
                              const SizedBox(height: 8),
                              Wrap(
                                spacing: 8,
                                runSpacing: 8,
                                children: analyticsPeriods.map((period) {
                                  final summary = _calcSummary(salesRepo, branchSales, period);
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
                    final branchName = branches.where((b) => b.id == person.branchId).map((b) => b.name).toList();

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
                                      if (branchName.isNotEmpty)
                                        Text(branchName.first, style: const TextStyle(fontSize: 11, color: Colors.black45)),
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
          if (role == 'admin')
            Card(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Müdür Analizleri', style: TextStyle(fontWeight: FontWeight.w700)),
                    const SizedBox(height: 8),
                    ...managers.map((manager) {
                      final managerSales = salesRepo
                          .listRecent(limit: 500, businessId: businessId)
                          .where((s) => s.createdBy == manager.username)
                          .toList();
                      final personnelForManager = auth
                          .listUsers()
                          .where((u) => u.managerId == manager.username && u.businessId == businessId)
                          .toList();
                      final managedBranchIds = [
                        if (manager.branchId.isNotEmpty) manager.branchId,
                        ...personnelForManager.where((u) => u.branchId.isNotEmpty).map((u) => u.branchId),
                      ].toSet().toList();
                      final branchNames = managedBranchIds.map((id) => _branchName(branches, id)).where((name) => name.isNotEmpty).toList();
                      final managedSales = salesRepo
                          .listRecent(limit: 500, businessId: businessId)
                          .where((s) => managedBranchIds.contains(s.branchId))
                          .toList();
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: Card(
                          color: Colors.grey.shade50,
                          child: Padding(
                            padding: const EdgeInsets.all(12),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(manager.name, style: const TextStyle(fontWeight: FontWeight.w700)),
                                const SizedBox(height: 4),
                                Text('Kendi satış: ${managerSales.length} • Yönettiği satış: ${managedSales.length}',
                                    style: const TextStyle(fontSize: 12, color: Colors.black54)),
                                const SizedBox(height: 4),
                                Text('Bağlı bayiler: ${branchNames.join(', ')}',
                                    style: const TextStyle(fontSize: 12, color: Colors.black54)),
                                Text('Bağlı personel: ${personnelForManager.map((p) => p.name).join(', ')}',
                                    style: const TextStyle(fontSize: 12, color: Colors.black54)),
                              ],
                            ),
                          ),
                        ),
                      );
                    }),
                    if (managers.isEmpty)
                      const Text('Müdür bulunamadı.', style: TextStyle(fontSize: 12, color: Colors.black54)),
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
                children: [
                  const Text('Maliyet & Gider Analizi', style: TextStyle(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 8),
                  _Row(label: 'Toplam maliyet', value: _fmtMoney(financial.cost)),
                  _Row(label: 'POS gideri', value: _fmtMoney(financial.posFee)),
                  _Row(label: 'KDV', value: _fmtMoney(financial.vat)),
                  _Row(label: 'Net kâr', value: _fmtMoney(financial.profit), valueColor: Colors.green),
                  _Row(label: 'Zarar', value: _fmtMoney(financial.loss), valueColor: Colors.red),
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
                children: [
                  const Text('Finansal Rapor', style: TextStyle(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 8),
                  LayoutBuilder(
                    builder: (context, constraints) {
                      const spacing = 12.0;
                      final cardWidth = (constraints.maxWidth - spacing) / 2;
                      return Wrap(
                        spacing: spacing,
                        runSpacing: spacing,
                        children: [
                          _StatCard(width: cardWidth, title: 'Toplam Satış', value: _fmtMoney(financial.revenue), icon: Icons.payments_outlined),
                          _StatCard(width: cardWidth, title: 'Toplam Maliyet', value: _fmtMoney(financial.cost), icon: Icons.inventory_2),
                          _StatCard(width: cardWidth, title: 'KDV', value: _fmtMoney(financial.vat), icon: Icons.receipt_long),
                          _StatCard(width: cardWidth, title: 'POS Gideri', value: _fmtMoney(financial.posFee), icon: Icons.credit_card),
                          _StatCard(width: cardWidth, title: 'Kâr', value: _fmtMoney(financial.profit), icon: Icons.trending_up),
                          _StatCard(width: cardWidth, title: 'Zarar', value: _fmtMoney(financial.loss), icon: Icons.trending_down),
                        ],
                      );
                    },
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

class _FinancialSummary {
  const _FinancialSummary({
    required this.revenue,
    required this.cost,
    required this.vat,
    required this.posFee,
    required this.profit,
    required this.loss,
  });
  final double revenue;
  final double cost;
  final double vat;
  final double posFee;
  final double profit;
  final double loss;
}

_FinancialSummary _financialSummary(List<Sale> sales) {
  double revenue = 0;
  double cost = 0;
  double vat = 0;
  double posFee = 0;
  double profit = 0;
  double loss = 0;
  for (final sale in sales) {
    revenue += sale.totalGross;
    vat += sale.totalVat;
    final fee = sale.paymentType == PaymentType.card
        ? (sale.posFeeType == PosFeeType.percent ? sale.totalGross * (sale.posFeeValue / 100.0) : sale.posFeeValue)
        : 0.0;
    posFee += fee;
    final approxCost = sale.totalGross - sale.totalNetProfit - fee;
    cost += approxCost;
    if (sale.totalNetProfit >= 0) {
      profit += sale.totalNetProfit;
    } else {
      loss += sale.totalNetProfit.abs();
    }
  }
  return _FinancialSummary(revenue: revenue, cost: cost, vat: vat, posFee: posFee, profit: profit, loss: loss);
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

String _branchName(List<Branch> branches, String branchId) {
  final branch = branches.where((b) => b.id == branchId).toList();
  if (branch.isEmpty) return '';
  return branch.first.name;
}

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

class _StatCard extends StatelessWidget {
  const _StatCard({required this.title, required this.value, required this.icon, required this.width});
  final String title;
  final String value;
  final IconData icon;
  final double width;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: width,
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              Icon(icon),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: const TextStyle(fontSize: 12), overflow: TextOverflow.ellipsis),
                    Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold), overflow: TextOverflow.ellipsis),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
