import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/repositories/outbox_repo.dart';

class SyncScreen extends ConsumerWidget {
  const SyncScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final outbox = ref.watch(outboxRepoProvider).list();

    return Padding(
      padding: const EdgeInsets.all(12),
      child: Column(
        children: [
          Row(
            children: [
              const Expanded(child: Text('Senkron Kuyruğu (Outbox)', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700))),
              TextButton.icon(
                onPressed: () async {
                  await ref.read(outboxRepoProvider).clearAll();
                  // ignore: unused_result
                  (context as Element).markNeedsBuild();
                },
                icon: const Icon(Icons.delete_outline),
                label: const Text('Temizle'),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Expanded(
            child: Card(
              child: outbox.isEmpty
                  ? const Center(child: Text('Kuyruk boş ✅'))
                  : ListView.separated(
                      itemCount: outbox.length,
                      separatorBuilder: (_, __) => const Divider(height: 1),
                      itemBuilder: (context, i) {
                        final e = outbox[i];
                        return ListTile(
                          dense: true,
                          leading: const Icon(Icons.cloud_upload_outlined),
                          title: Text(e.type),
                          subtitle: Text(DateTime.fromMillisecondsSinceEpoch(e.createdAt).toString()),
                          trailing: Text('retry:${e.retryCount}'),
                        );
                      },
                    ),
            ),
          ),
          const SizedBox(height: 8),
          const Text('MVP: Backend yok. Burada sadece offline kuyruğu gösteriyoruz.'),
        ],
      ),
    );
  }
}
