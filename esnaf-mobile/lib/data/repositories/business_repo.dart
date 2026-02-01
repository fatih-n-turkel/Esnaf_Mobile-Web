import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../local/hive_boxes.dart';
import '../models/models.dart';

class BusinessRepo {
  static const _seedKey = 'businesses_initialized';

  BusinessRepo() {
    _seed();
  }

  void _seed() {
    final box = HiveBoxes.box(HiveBoxes.businesses);
    if (box.get(_seedKey) != null) return;
    final now = DateTime.now().millisecondsSinceEpoch;
    final items = [
      Business(
        id: 'biz-sen-bakkal',
        name: 'Şen Bakkal',
        planId: 'plan-basic',
        billingCycle: 'MONTHLY',
        createdAt: now,
        paymentMethods: [
          PaymentMethod(
            id: newId(),
            label: 'Ana Kart',
            holderName: 'Fatih Yılmaz',
            cardNumber: '4111 1111 1111 3281',
            expMonth: '12',
            expYear: '2027',
            cvc: '123',
          ),
        ],
      ),
      Business(
        id: 'biz-sen-kasap',
        name: 'Şen Kasap',
        planId: 'plan-free',
        billingCycle: 'FREE',
        createdAt: now,
        paymentMethods: [],
      ),
    ];
    for (final biz in items) {
      box.put(biz.id, biz.toMap());
    }
    box.put(_seedKey, {'value': true});
  }

  List<Business> list() {
    final box = HiveBoxes.box(HiveBoxes.businesses);
    final items = <Business>[];
    for (final entry in box.values) {
      if (entry is Map && entry['id'] != null && entry['name'] != null) {
        items.add(Business.fromMap(entry));
      }
    }
    items.sort((a, b) => a.name.compareTo(b.name));
    return items;
  }

  Business? getById(String id) {
    final box = HiveBoxes.box(HiveBoxes.businesses);
    final raw = box.get(id);
    if (raw == null) return null;
    return Business.fromMap(raw);
  }

  Future<void> upsert(Business business) async {
    final box = HiveBoxes.box(HiveBoxes.businesses);
    await box.put(business.id, business.toMap());
  }

  Future<void> remove(String id) async {
    final box = HiveBoxes.box(HiveBoxes.businesses);
    await box.delete(id);
  }
}

final businessRepoProvider = Provider<BusinessRepo>((ref) => BusinessRepo());
