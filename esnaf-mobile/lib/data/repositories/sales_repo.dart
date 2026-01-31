import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../local/hive_boxes.dart';
import '../models/models.dart';
import 'products_repo.dart';
import 'outbox_repo.dart';
import 'notifications_repo.dart';

class SalesRepo {
  SalesRepo(this.ref);
  final Ref ref;

  Future<String> createSale({
    required List<SaleItem> items,
    required PaymentType paymentType,
    required PosFeeType posFeeType,
    required double posFeeValue,
    required String createdBy,
    required String branchId,
  }) async {
    if (items.isEmpty) throw Exception('Sepet boş');

    final now = DateTime.now().millisecondsSinceEpoch;
    final saleId = newId();
    final receiptNo = 'S$now';

    // Patch saleId into items
    final patchedItems = items
        .map((i) => SaleItem(
              id: i.id,
              saleId: saleId,
              productId: i.productId,
              productName: i.productName,
              qty: i.qty,
              unitSalePrice: i.unitSalePrice,
              unitCost: i.unitCost,
              vatRate: i.vatRate,
            ))
        .toList();

    final totalGross = patchedItems.fold<double>(0, (s, i) => s + i.lineGross);
    final totalVat = patchedItems.fold<double>(0, (s, i) => s + i.lineVat);
    final totalProfitRaw = patchedItems.fold<double>(0, (s, i) => s + i.lineProfit);

    final posFee = paymentType == PaymentType.card
        ? (posFeeType == PosFeeType.percent ? totalGross * (posFeeValue / 100.0) : posFeeValue)
        : 0.0;

    final totalNetProfit = totalProfitRaw - posFee;

    final sale = Sale(
      id: saleId,
      receiptNo: receiptNo,
      paymentType: paymentType,
      posFeeType: posFeeType,
      posFeeValue: posFeeValue,
      totalGross: totalGross,
      totalVat: totalVat,
      totalNetProfit: totalNetProfit,
      createdAt: now,
      createdBy: createdBy,
      branchId: branchId,
      status: 'completed',
    );

    // Write sale + items
    final salesBox = HiveBoxes.box(HiveBoxes.sales);
    final itemsBox = HiveBoxes.box(HiveBoxes.saleItems);
    await salesBox.put(sale.id, sale.toMap());
    for (final it in patchedItems) {
      await itemsBox.put(it.id, it.toMap());
    }

    // Decrease stock + stock movements
    final prodRepo = ref.read(productsRepoProvider);
    final movBox = HiveBoxes.box(HiveBoxes.stockMovements);
    for (final it in patchedItems) {
      await prodRepo.adjustStock(it.productId, -it.qty, branchId: branchId);
      final mov = StockMovement(
        id: newId(),
        productId: it.productId,
        type: StockMoveType.outMove,
        qty: it.qty,
        reason: 'sale:$saleId',
        createdAt: now,
        createdBy: createdBy,
        branchId: branchId,
      );
      await movBox.put(mov.id, mov.toMap());
    }

    // Outbox event for future sync
    final outbox = ref.read(outboxRepoProvider);
    await outbox.enqueue(type: 'sale_created', payload: {
      'sale': sale.toMap(),
      'items': patchedItems.map((e) => e.toMap()).toList(),
    });

    final notifications = ref.read(notificationsRepoProvider);
    notifications.add(AppNotification(
      id: newId(),
      title: 'Yeni satış oluşturuldu',
      message: '$createdBy yeni bir satış yaptı.',
      createdAt: now,
      scope: NotificationScope.branch,
      branchId: branchId,
    ));

    return saleId;
  }

  List<Sale> listRecent({int limit = 20}) {
    final box = HiveBoxes.box(HiveBoxes.sales);
    final sales = box.values.map((m) => Sale.fromMap(m)).toList();
    sales.sort((a, b) => b.createdAt.compareTo(a.createdAt));
    return sales.take(limit).toList();
  }

  List<SaleItem> itemsOfSale(String saleId) {
    final box = HiveBoxes.box(HiveBoxes.saleItems);
    return box.values.map((m) => SaleItem.fromMap(m)).where((i) => i.saleId == saleId).toList();
  }
}

final salesRepoProvider = Provider<SalesRepo>((ref) => SalesRepo(ref));
