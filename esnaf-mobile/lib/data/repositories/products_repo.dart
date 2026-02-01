import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../local/hive_boxes.dart';
import '../models/models.dart';
import 'branches_repo.dart';
import 'notifications_repo.dart';
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
        businessId: businessBakkalId,
        name: 'Su 500ml',
        category: 'İçecek',
        salePrice: 10,
        costPrice: 6,
        vatRate: s.defaultVatRate,
        criticalStock: 10,
        stockQty: 50,
        stockByBranch: const {
          defaultBranchMainId: 30,
          defaultBranchCoastId: 20,
        },
        isActive: true,
        qrValue: 'P:SU500',
        updatedAt: now,
      ),
      Product(
        id: newId(),
        businessId: businessBakkalId,
        name: 'Çikolata',
        category: 'Atıştırmalık',
        salePrice: 15,
        costPrice: 9,
        vatRate: s.defaultVatRate,
        criticalStock: 8,
        stockQty: 30,
        stockByBranch: const {
          defaultBranchMainId: 18,
          defaultBranchCoastId: 12,
        },
        isActive: true,
        qrValue: 'P:CIKOLATA',
        updatedAt: now,
      ),
      Product(
        id: newId(),
        businessId: businessBakkalId,
        name: 'Defter A4',
        category: 'Kırtasiye',
        salePrice: 35,
        costPrice: 22,
        vatRate: s.defaultVatRate,
        criticalStock: 5,
        stockQty: 12,
        stockByBranch: const {
          defaultBranchMainId: 7,
          defaultBranchCoastId: 5,
        },
        isActive: true,
        qrValue: 'P:DEFTERA4',
        updatedAt: now,
      ),
      Product(
        id: newId(),
        businessId: businessKasapId,
        name: 'Dana Kuşbaşı 1KG',
        category: 'Kasap',
        salePrice: 420,
        costPrice: 320,
        vatRate: s.defaultVatRate,
        criticalStock: 6,
        stockQty: 24,
        stockByBranch: const {
          defaultBranchKasapId: 24,
        },
        isActive: true,
        qrValue: 'P:KASAP001',
        updatedAt: now,
      ),
    ];

    for (final p in seed) {
      await box.put(p.id, p.toMap());
    }
  }

  List<Product> list({
    String? query,
    String? category,
    bool? onlyCritical,
    String? branchId,
    String? businessId,
  }) {
    final box = HiveBoxes.box(HiveBoxes.products);
    final items = box.values
        .map((m) => Product.fromMap(m))
        .where((p) => p.isActive)
        .where((p) => businessId == null || businessId.isEmpty ? true : p.businessId == businessId)
        .toList();

    return items.where((p) {
      final qOk = (query == null || query.trim().isEmpty)
          ? true
          : p.name.toLowerCase().contains(query.toLowerCase()) || p.qrValue.toLowerCase().contains(query.toLowerCase());
      final cOk = (category == null || category.isEmpty) ? true : p.category == category;
      final stock = _stockForBranch(p, branchId);
      final critOk = (onlyCritical == true) ? stock <= p.criticalStock : true;
      return qOk && cOk && critOk;
    }).map((p) {
      if (branchId == null || branchId.isEmpty) return p;
      return p.copyWith(stockQty: _stockForBranch(p, branchId));
    }).toList()
      ..sort((a, b) => a.name.compareTo(b.name));
  }

  List<String> categories({String? businessId}) {
    final box = HiveBoxes.box(HiveBoxes.products);
    final set = <String>{};
    for (final m in box.values) {
      final p = Product.fromMap(m);
      if (businessId != null && businessId.isNotEmpty && p.businessId != businessId) continue;
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

  double stockForBranch(Product p, String? branchId) => _stockForBranch(p, branchId);

  Future<void> upsert(Product p) async {
    final box = HiveBoxes.box(HiveBoxes.products);
    await box.put(p.id, p.toMap());
  }

  Future<void> renameCategory(String fromName, String toName, {String? businessId}) async {
    final trimmed = toName.trim();
    if (trimmed.isEmpty) return;
    final box = HiveBoxes.box(HiveBoxes.products);
    for (final entry in box.values) {
      final p = Product.fromMap(entry);
      if (businessId != null && businessId.isNotEmpty && p.businessId != businessId) continue;
      if (p.category == fromName) {
        await box.put(
          p.id,
          p.copyWith(category: trimmed, updatedAt: DateTime.now().millisecondsSinceEpoch).toMap(),
        );
      }
    }
  }

  Future<void> setCategoryAssignments(String categoryName, Set<String> productIds, {String? businessId}) async {
    final box = HiveBoxes.box(HiveBoxes.products);
    for (final entry in box.values) {
      final p = Product.fromMap(entry);
      if (businessId != null && businessId.isNotEmpty && p.businessId != businessId) continue;
      final shouldHave = productIds.contains(p.id);
      if (shouldHave && p.category != categoryName) {
        await box.put(
          p.id,
          p.copyWith(category: categoryName, updatedAt: DateTime.now().millisecondsSinceEpoch).toMap(),
        );
        continue;
      }
      if (!shouldHave && p.category == categoryName) {
        await box.put(
          p.id,
          p.copyWith(category: '', updatedAt: DateTime.now().millisecondsSinceEpoch).toMap(),
        );
      }
    }
  }

  Future<void> adjustStock(String productId, double delta, {String? branchId}) async {
    final p = getById(productId);
    if (p == null) return;
    if (branchId == null || branchId.isEmpty) {
      await upsert(p.copyWith(stockQty: p.stockQty + delta, updatedAt: DateTime.now().millisecondsSinceEpoch));
      return;
    }
    final nextByBranch = Map<String, double>.from(p.stockByBranch);
    final current = nextByBranch[branchId] ?? 0;
    final rawNext = current + delta;
    final next = rawNext < 0 ? 0.0 : rawNext;
    nextByBranch[branchId] = next;
    final total = nextByBranch.values.fold<double>(0, (sum, value) => sum + value);
    await upsert(
      p.copyWith(
        stockQty: total,
        stockByBranch: nextByBranch,
        updatedAt: DateTime.now().millisecondsSinceEpoch,
      ),
    );
    if (current > 0 && next <= 0) {
      final branches = ref.read(branchesRepoProvider).list(businessId: p.businessId);
      final branchName = branches
          .firstWhere(
            (b) => b.id == branchId,
            orElse: () => Branch(id: branchId, name: 'Şube', createdAt: 0, businessId: p.businessId),
          )
          .name;
      ref.read(notificationsRepoProvider).add(
            AppNotification(
              id: newId(),
              title: 'Stok tükendi',
              message: '${p.name} ürünü $branchName için tükendi.',
              createdAt: DateTime.now().millisecondsSinceEpoch,
              scope: NotificationScope.branch,
              businessId: p.businessId,
              branchId: branchId,
            ),
          );
    }
  }
}

double _stockForBranch(Product p, String? branchId) {
  if (branchId == null || branchId.isEmpty) return p.stockQty;
  if (p.stockByBranch.isEmpty) return p.stockQty;
  return p.stockByBranch[branchId] ?? 0;
}

final productsRepoProvider = Provider<ProductsRepo>((ref) => ProductsRepo(ref));
final productsSeedProvider = FutureProvider<void>((ref) async {
  final repo = ref.watch(productsRepoProvider);
  await repo.ensureSeed();
});
