import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../local/hive_boxes.dart';
import '../models/models.dart';
import 'branches_repo.dart';

class NotificationsRepo extends ChangeNotifier {
  NotificationsRepo(this.ref) {
    _seed();
  }

  final Ref ref;
  static const _seedKey = 'notifications_initialized';

  void _seed() {
    final box = HiveBoxes.box(HiveBoxes.notifications);
    if (box.get(_seedKey) != null) return;
    final now = DateTime.now().millisecondsSinceEpoch;
    final seed = [
      AppNotification(
        id: newId(),
        title: 'Kritik stok uyarısı',
        message: 'Merkez Şube için kritik stok seviyesi görüldü.',
        createdAt: now,
        scope: NotificationScope.branch,
        businessId: businessBakkalId,
        branchId: defaultBranchMainId,
      ),
      AppNotification(
        id: newId(),
        title: 'Gün sonu satış özeti',
        message: 'Bugünkü satışlar raporlandı. Analiz sayfasına göz atın.',
        createdAt: now,
        scope: NotificationScope.global,
        businessId: businessBakkalId,
      ),
    ];
    for (final note in seed) {
      box.put(note.id, note.toMap());
    }
    box.put(_seedKey, {'value': true});
  }

  List<AppNotification> list({String? branchId, String? userId, String? role, String? businessId}) {
    final box = HiveBoxes.box(HiveBoxes.notifications);
    final notes = box.values
        .where((entry) => entry is Map && entry['title'] != null)
        .map((entry) => AppNotification.fromMap(entry))
        .toList();
    notes.sort((a, b) => b.createdAt.compareTo(a.createdAt));
    return notes.where((note) {
      if (businessId != null && businessId.isNotEmpty && note.businessId != businessId) return false;
      if (role == 'admin') return true;
      if (note.scope == NotificationScope.global) return true;
      if (note.scope == NotificationScope.branch) return note.branchId == branchId;
      if (note.scope == NotificationScope.user) return note.userId == userId;
      return false;
    }).toList();
  }

  int unreadCount({String? branchId, String? userId, String? role, String? businessId}) {
    return list(branchId: branchId, userId: userId, role: role, businessId: businessId)
        .where((n) => n.readAt == null)
        .length;
  }

  void add(AppNotification notification) {
    final box = HiveBoxes.box(HiveBoxes.notifications);
    box.put(notification.id, notification.toMap());
    notifyListeners();
  }

  void markAllRead({String? branchId, String? userId, String? role, String? businessId}) {
    final box = HiveBoxes.box(HiveBoxes.notifications);
    final now = DateTime.now().millisecondsSinceEpoch;
    for (final note in list(branchId: branchId, userId: userId, role: role, businessId: businessId)) {
      if (note.readAt != null) continue;
      box.put(note.id, {...note.toMap(), 'readAt': now});
    }
    notifyListeners();
  }
}

final notificationsRepoProvider = ChangeNotifierProvider<NotificationsRepo>((ref) => NotificationsRepo(ref));
