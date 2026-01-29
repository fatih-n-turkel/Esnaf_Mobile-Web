import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../local/hive_boxes.dart';
import '../models/models.dart';

class OutboxRepo {
  Future<void> enqueue({required String type, required Map<String, dynamic> payload}) async {
    final box = HiveBoxes.box(HiveBoxes.outbox);
    final ev = OutboxEvent(
      id: newId(),
      type: type,
      payload: payload,
      createdAt: DateTime.now().millisecondsSinceEpoch,
      retryCount: 0,
      lastError: null,
    );
    await box.put(ev.id, ev.toMap());
  }

  List<OutboxEvent> list() {
    final box = HiveBoxes.box(HiveBoxes.outbox);
    final items = box.values.map((m) => OutboxEvent.fromMap(m)).toList();
    items.sort((a, b) => b.createdAt.compareTo(a.createdAt));
    return items;
  }

  Future<void> clearAll() async {
    final box = HiveBoxes.box(HiveBoxes.outbox);
    await box.clear();
  }
}

final outboxRepoProvider = Provider<OutboxRepo>((ref) => OutboxRepo());
