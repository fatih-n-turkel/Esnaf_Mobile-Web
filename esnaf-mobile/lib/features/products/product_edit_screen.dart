import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/models.dart';
import '../../data/repositories/products_repo.dart';
import '../../data/repositories/settings_repo.dart';

class ProductEditScreen extends ConsumerStatefulWidget {
  const ProductEditScreen({super.key, required this.product});
  final Product? product;

  @override
  ConsumerState<ProductEditScreen> createState() => _ProductEditScreenState();
}

class _ProductEditScreenState extends ConsumerState<ProductEditScreen> {
  late final TextEditingController name;
  late final TextEditingController category;
  late final TextEditingController salePrice;
  late final TextEditingController costPrice;
  late final TextEditingController vatRate;
  late final TextEditingController criticalStock;
  late final TextEditingController stockQty;
  late final TextEditingController qrValue;

  @override
  void initState() {
    super.initState();
    final s = ref.read(settingsProvider);
    final p = widget.product;
    name = TextEditingController(text: p?.name ?? '');
    category = TextEditingController(text: p?.category ?? '');
    salePrice = TextEditingController(text: (p?.salePrice ?? 0).toStringAsFixed(2));
    costPrice = TextEditingController(text: (p?.costPrice ?? 0).toStringAsFixed(2));
    vatRate = TextEditingController(text: ((p?.vatRate ?? s.defaultVatRate) * 100).toStringAsFixed(0)); // show percent
    criticalStock = TextEditingController(text: (p?.criticalStock ?? s.criticalStockDefault).toStringAsFixed(0));
    stockQty = TextEditingController(text: (p?.stockQty ?? 0).toStringAsFixed(0));
    qrValue = TextEditingController(text: p?.qrValue ?? 'P:${(p?.name ?? 'URUN').toUpperCase()}');
  }

  @override
  void dispose() {
    name.dispose();
    category.dispose();
    salePrice.dispose();
    costPrice.dispose();
    vatRate.dispose();
    criticalStock.dispose();
    stockQty.dispose();
    qrValue.dispose();
    super.dispose();
  }

  double _d(String v) => double.tryParse(v.replaceAll(',', '.')) ?? 0.0;

  @override
  Widget build(BuildContext context) {
    final editing = widget.product != null;

    return Scaffold(
      appBar: AppBar(title: Text(editing ? 'Ürün Düzenle' : 'Yeni Ürün')),
      body: Padding(
        padding: const EdgeInsets.all(12),
        child: ListView(
          children: [
            TextField(controller: name, decoration: const InputDecoration(labelText: 'Ürün adı')),
            const SizedBox(height: 10),
            TextField(controller: category, decoration: const InputDecoration(labelText: 'Kategori')),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(child: TextField(controller: salePrice, decoration: const InputDecoration(labelText: 'Satış ₺'), keyboardType: const TextInputType.numberWithOptions(decimal: true))),
                const SizedBox(width: 8),
                Expanded(child: TextField(controller: costPrice, decoration: const InputDecoration(labelText: 'Alış ₺'), keyboardType: const TextInputType.numberWithOptions(decimal: true))),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(child: TextField(controller: vatRate, decoration: const InputDecoration(labelText: 'KDV %'), keyboardType: const TextInputType.numberWithOptions(decimal: true))),
                const SizedBox(width: 8),
                Expanded(child: TextField(controller: criticalStock, decoration: const InputDecoration(labelText: 'Kritik stok'), keyboardType: const TextInputType.numberWithOptions(decimal: true))),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(child: TextField(controller: stockQty, decoration: const InputDecoration(labelText: 'Mevcut stok'), keyboardType: const TextInputType.numberWithOptions(decimal: true))),
                const SizedBox(width: 8),
                Expanded(child: TextField(controller: qrValue, decoration: const InputDecoration(labelText: 'QR değeri'))),
              ],
            ),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: () async {
                final repo = ref.read(productsRepoProvider);
                final now = DateTime.now().millisecondsSinceEpoch;
                final s = ref.read(settingsProvider);

                final p = (widget.product ?? Product(
                      id: newId(),
                      name: '',
                      category: '',
                      salePrice: 0,
                      costPrice: 0,
                      vatRate: s.defaultVatRate,
                      criticalStock: s.criticalStockDefault,
                      stockQty: 0,
                      isActive: true,
                      qrValue: '',
                      updatedAt: now,
                    ))
                    .copyWith(
                  name: name.text.trim(),
                  category: category.text.trim(),
                  salePrice: _d(salePrice.text),
                  costPrice: _d(costPrice.text),
                  vatRate: _d(vatRate.text) / 100.0,
                  criticalStock: _d(criticalStock.text),
                  stockQty: _d(stockQty.text),
                  qrValue: qrValue.text.trim(),
                  updatedAt: now,
                );

                await repo.upsert(p);
                if (!context.mounted) return;
                Navigator.of(context).pop(p);
              },
              icon: const Icon(Icons.save),
              label: const Text('Kaydet'),
            ),
          ],
        ),
      ),
    );
  }
}
