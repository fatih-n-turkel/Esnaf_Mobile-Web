import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../../data/models/models.dart';
import '../../data/repositories/products_repo.dart';
import '../../data/repositories/settings_repo.dart';
import '../../data/repositories/branches_repo.dart';
import '../../data/repositories/auth_repo.dart';

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
                Expanded(
                  child: TextField(
                    controller: qrValue,
                    decoration: const InputDecoration(labelText: 'QR değeri'),
                    onChanged: (_) => setState(() {}),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.grey.shade50,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('QR Etiketi', style: TextStyle(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  if (qrValue.text.trim().isEmpty)
                    const Text(
                      'QR değeri girildiğinde burada etiketi oluşur.',
                      style: TextStyle(fontSize: 12, color: Colors.black54),
                    )
                  else
                    Center(
                      child: QrImageView(
                        data: qrValue.text.trim(),
                        size: 140,
                        backgroundColor: Colors.white,
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: () async {
                final repo = ref.read(productsRepoProvider);
                final now = DateTime.now().millisecondsSinceEpoch;
                final s = ref.read(settingsProvider);
                final auth = ref.read(authRepoProvider);
                final businessId = auth.getBusinessId();
                final branchRepo = ref.read(branchesRepoProvider);
                final businessBranches = branchRepo.list(businessId: businessId);
                final defaultBranchId =
                    businessBranches.isNotEmpty ? businessBranches.first.id : defaultBranchMainId;

                final p = (widget.product ?? Product(
                      id: newId(),
                      businessId: businessId,
                      name: '',
                      category: '',
                      salePrice: 0,
                      costPrice: 0,
                      vatRate: s.defaultVatRate,
                      criticalStock: s.criticalStockDefault,
                      stockQty: 0,
                      stockByBranch: {defaultBranchId: 0},
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
                  stockByBranch: widget.product?.stockByBranch ?? {defaultBranchId: _d(stockQty.text)},
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
