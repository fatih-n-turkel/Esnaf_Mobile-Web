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

    return const Center(child: Text('Personel sayfası kaldırıldı.'));
  }
}
