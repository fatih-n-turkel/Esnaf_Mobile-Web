import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../local/hive_boxes.dart';
import '../models/models.dart';

class ApplicationsRepo {
  static const _seedKey = 'applications_initialized';

  ApplicationsRepo() {
    _seed();
  }

  void _seed() {
    final box = HiveBoxes.box(HiveBoxes.applications);
    if (box.get(_seedKey) != null) return;
    final sample = BusinessApplication(
      id: 'app-sample',
      businessName: 'Örnek Market',
      username: 'ornekadmin',
      password: '1234',
      createdAt: DateTime.now().millisecondsSinceEpoch,
      status: 'PENDING',
    );
    box.put(sample.id, sample.toMap());
    box.put(_seedKey, {'value': true});
  }

  List<BusinessApplication> list() {
    final box = HiveBoxes.box(HiveBoxes.applications);
    final items = <BusinessApplication>[];
    for (final entry in box.values) {
      if (entry is Map && entry['id'] != null && entry['businessName'] != null) {
        items.add(BusinessApplication.fromMap(entry));
      }
    }
    items.sort((a, b) => b.createdAt.compareTo(a.createdAt));
    return items;
  }

  Future<void> add(BusinessApplication application) async {
    final box = HiveBoxes.box(HiveBoxes.applications);
    await box.put(application.id, application.toMap());
  }

  Future<void> updateStatus(String id, String status) async {
    final box = HiveBoxes.box(HiveBoxes.applications);
    final raw = box.get(id);
    if (raw is! Map) return;
    await box.put(id, {...raw, 'status': status});
  }
}

final applicationsRepoProvider = Provider<ApplicationsRepo>((ref) => ApplicationsRepo());
