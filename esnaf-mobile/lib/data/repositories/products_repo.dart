import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../local/hive_boxes.dart';
import '../models/models.dart';
import 'settings_repo.dart';

class ProductsRepo {
  ProductsRepo(this.ref);

  final Ref ref;

  Future<void> ensureSeed() async {
    final box = HiveBoxes.box(HiveBoxes.products);
    if (box.isNotEmpty) return;

    final s = ref.read(settingsProvider);
    final now = DateTime.now().millisecondsSinceEpoch;

    final seed = [
      Product(
        id: newId(),
        name: 'Su 500ml',
        category: 'İçecek',
        salePrice: 10,
        costPrice: 6,
        vatRate: s.defaultVatRate,
        criticalStock: 10,
        stockQty: 50,
        isActive: true,
        qrValue: 'P:SU500',
        updatedAt: now,
      ),
      Product(
        id: newId(),
        name: 'Çikolata',
        category: 'Atıştırmalık',
        salePrice: 15,
        costPrice: 9,
        vatRate: s.defaultVatRate,
        criticalStock: 8,
        stockQty: 30,
        isActive: true,
        qrValue: 'P:CIKOLATA',
        updatedAt: now,
      ),
      Product(
        id: newId(),
        name: 'Defter A4',
        category: 'Kırtasiye',
        salePrice: 35,
        costPrice: 22,
        vatRate: s.defaultVatRate,
        criticalStock: 5,
        stockQty: 12,
        isActive: true,
        qrValue: 'P:DEFTERA4',
        updatedAt: now,
      ),
    ];

    for (final p in seed) {
      await box.put(p.id, p.toMap());
    }
  }

  List<Product> list({String? query, String? category, bool? onlyCritical}) {
    final box = HiveBoxes.box(HiveBoxes.products);
    final items = box.values.map((m) => Product.fromMap(m)).where((p) => p.isActive).toList();

    return items.where((p) {
      final qOk = (query == null || query.trim().isEmpty)
          ? true
          : p.name.toLowerCase().contains(query.toLowerCase()) || p.qrValue.toLowerCase().contains(query.toLowerCase());
      final cOk = (category == null || category.isEmpty) ? true : p.category == category;
      final critOk = (onlyCritical == true) ? p.stockQty <= p.criticalStock : true;
      return qOk && cOk && critOk;
    }).toList()
      ..sort((a, b) => a.name.compareTo(b.name));
  }

  List<String> categories() {
    final box = HiveBoxes.box(HiveBoxes.products);
    final set = <String>{};
    for (final m in box.values) {
      final p = Product.fromMap(m);
      if (p.category.trim().isNotEmpty) set.add(p.category);
    }
    final list = set.toList()..sort();
    return list;
  }

  Product? getById(String id) {
    final box = HiveBoxes.box(HiveBoxes.products);
    final m = box.get(id);
    if (m == null) return null;
    return Product.fromMap(m);
  }

  Future<void> upsert(Product p) async {
    final box = HiveBoxes.box(HiveBoxes.products);
    await box.put(p.id, p.toMap());
  }

  Future<void> adjustStock(String productId, double delta) async {
    final p = getById(productId);
    if (p == null) return;
    await upsert(p.copyWith(stockQty: p.stockQty + delta, updatedAt: DateTime.now().millisecondsSinceEpoch));
  }
}

final productsRepoProvider = Provider<ProductsRepo>((ref) => ProductsRepo(ref));
final productsSeedProvider = FutureProvider<void>((ref) async {
  final repo = ref.watch(productsRepoProvider);
  await repo.ensureSeed();
});
