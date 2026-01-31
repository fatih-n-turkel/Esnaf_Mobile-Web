import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/repositories/auth_repo.dart';

class ManagerScreen extends ConsumerWidget {
  const ManagerScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final role = ref.watch(authRepoProvider).getRole();

    if (role != 'manager') {
      return const Center(child: Text('Bu sayfa sadece müdür kullanıcılar içindir.'));
    }

    return Padding(
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: const [
          Text('Müdür Sayfası', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
          SizedBox(height: 4),
          Text('Operasyon özetleri, ekip yönetimi ve satış kontrolleri.', style: TextStyle(color: Colors.black54)),
        ],
      ),
    );
  }
}
