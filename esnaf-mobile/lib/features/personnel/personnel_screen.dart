import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/repositories/auth_repo.dart';

class PersonnelScreen extends ConsumerWidget {
  const PersonnelScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final role = ref.watch(authRepoProvider).getRole();

    if (role != 'staff') {
      return const Center(child: Text('Bu sayfa sadece personel kullanıcılar içindir.'));
    }

    return Padding(
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: const [
          Text('Personel Sayfası', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
          SizedBox(height: 4),
          Text('Günlük görevler, hızlı satış ve stok kontrolü.', style: TextStyle(color: Colors.black54)),
        ],
      ),
    );
  }
}
