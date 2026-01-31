import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/repositories/sales_repo.dart';
import '../../data/repositories/auth_repo.dart';

class ReportsScreen extends ConsumerWidget {
  const ReportsScreen({super.key});

  bool _canSeeProfit(String role) => role == 'admin' || role == 'manager';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final role = ref.watch(authRepoProvider).getRole();
    final canProfit = _canSeeProfit(role);
    if (!canProfit) {
      return const Center(child: Text('Bu sayfa sadece admin ve müdür kullanıcılar içindir.'));
    }

    final sales = ref.watch(salesRepoProvider).listRecent(limit: 200);

    final totalGross = sales.fold<double>(0, (s, e) => s + e.totalGross);
    final totalVat = sales.fold<double>(0, (s, e) => s + e.totalVat);
    final totalProfit = sales.fold<double>(0, (s, e) => s + e.totalNetProfit);

    return Padding(
      padding: const EdgeInsets.all(12),
      child: ListView(
        children: [
          const Text('Raporlar (MVP: son satışlar toplamı)', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              _Card(label: 'Ciro', value: totalGross),
              _Card(label: 'KDV', value: totalVat),
              if (canProfit) _Card(label: 'Net Kâr', value: totalProfit),
            ],
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Son Satışlar', style: TextStyle(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 8),
                  if (sales.isEmpty) const Text('Henüz satış yok'),
                  ...sales.take(30).map((s) => ListTile(
                        dense: true,
                        contentPadding: EdgeInsets.zero,
                        title: Text(s.receiptNo),
                        subtitle: Text('Toplam: ${s.totalGross.toStringAsFixed(2)} • KDV: ${s.totalVat.toStringAsFixed(2)}'),
                        trailing: canProfit ? Text('Kâr: ${s.totalNetProfit.toStringAsFixed(2)}') : null,
                      )),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Card extends StatelessWidget {
  const _Card({required this.label, required this.value});
  final String label;
  final double value;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 180,
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label),
              const SizedBox(height: 6),
              Text('₺${value.toStringAsFixed(2)}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            ],
          ),
        ),
      ),
    );
  }
}
