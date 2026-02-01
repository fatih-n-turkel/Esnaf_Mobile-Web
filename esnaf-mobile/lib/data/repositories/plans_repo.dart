import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../local/hive_boxes.dart';
import '../models/models.dart';

class PlansRepo {
  static const _seedKey = 'plans_initialized';

  PlansRepo() {
    _seed();
  }

  void _seed() {
    final box = HiveBoxes.box(HiveBoxes.plans);
    if (box.get(_seedKey) != null) return;
    final plans = [
      BusinessPlan(
        id: 'plan-free',
        name: 'Ücretsiz',
        monthlyPrice: 0,
        annualPrice: 0,
        maxEmployees: 1,
        maxBranches: 1,
        features: ['Dashboard ekranı', 'Hızlı satış'],
      ),
      BusinessPlan(
        id: 'plan-basic',
        name: 'Basic',
        monthlyPrice: 499,
        annualPrice: 499 * 12 * 0.8,
        maxEmployees: 5,
        maxBranches: 1,
        features: ['Hızlı satış sistemleri', '5 çalışan / 1 şube'],
      ),
      BusinessPlan(
        id: 'plan-pro',
        name: 'Pro',
        monthlyPrice: 999,
        annualPrice: 999 * 12 * 0.8,
        maxEmployees: 50,
        maxBranches: 3,
        features: ['Tüm özellikler aktif', '50 çalışan / 3 şube'],
      ),
    ];
    for (final plan in plans) {
      box.put(plan.id, plan.toMap());
    }
    box.put(_seedKey, {'value': true});
  }

  List<BusinessPlan> list() {
    final box = HiveBoxes.box(HiveBoxes.plans);
    final items = <BusinessPlan>[];
    for (final entry in box.values) {
      if (entry is Map && entry['id'] != null && entry['name'] != null) {
        items.add(BusinessPlan.fromMap(entry));
      }
    }
    items.sort((a, b) => a.monthlyPrice.compareTo(b.monthlyPrice));
    return items;
  }

  Future<void> saveAll(List<BusinessPlan> plans) async {
    final box = HiveBoxes.box(HiveBoxes.plans);
    for (final plan in plans) {
      await box.put(plan.id, plan.toMap());
    }
  }
}

final plansRepoProvider = Provider<PlansRepo>((ref) => PlansRepo());
