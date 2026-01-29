import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/repositories/auth_repo.dart';

class AppShell extends ConsumerWidget {
  const AppShell({super.key, required this.child});
  final Widget child;

  static const _tabs = [
    _Tab('Ana', Icons.dashboard, '/home'),
    _Tab('Satış', Icons.point_of_sale, '/sale'),
    _Tab('Ürünler', Icons.inventory_2, '/products'),
    _Tab('Stok', Icons.warehouse, '/stock'),
  ];

  int _indexForLocation(String loc) {
    if (loc.startsWith('/sale')) return 1;
    if (loc.startsWith('/products')) return 2;
    if (loc.startsWith('/stock')) return 3;
    return 0;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final role = ref.watch(authRepoProvider).getRole();
    final loc = GoRouterState.of(context).matchedLocation;
    final current = _indexForLocation(loc);

    return Scaffold(
      appBar: AppBar(
        title: Text('Esnaf Fast • ${role.toUpperCase()}'),
        actions: [
          IconButton(
            tooltip: 'Bildirimler',
            onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('MVP: Bildirimler daha sonra')),
            ),
            icon: const Icon(Icons.notifications_none),
          ),
          PopupMenuButton<String>(
            onSelected: (v) async {
              if (v == 'reports') context.go('/reports');
              if (v == 'settings') context.go('/settings');
              if (v == 'sync') context.go('/sync');
              if (v == 'logout') await ref.read(authRepoProvider).logout();
            },
            itemBuilder: (c) => const [
              PopupMenuItem(value: 'reports', child: Text('Raporlar')),
              PopupMenuItem(value: 'settings', child: Text('Ayarlar')),
              PopupMenuItem(value: 'sync', child: Text('Senkron')),
              PopupMenuItem(value: 'logout', child: Text('Çıkış')),
            ],
          ),
        ],
      ),
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: current,
        destinations: _tabs
            .map((t) => NavigationDestination(icon: Icon(t.icon), label: t.label))
            .toList(),
        onDestinationSelected: (i) => context.go(_tabs[i].path),
      ),
    );
  }
}

class _Tab {
  const _Tab(this.label, this.icon, this.path);
  final String label;
  final IconData icon;
  final String path;
}
