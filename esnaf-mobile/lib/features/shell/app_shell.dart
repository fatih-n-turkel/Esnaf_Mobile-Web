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
            onPressed: () => context.go('/notifications'),
            icon: const Icon(Icons.notifications_none),
          ),
          PopupMenuButton<String>(
            onSelected: (v) async {
              if (v == 'analysis') context.go('/analysis');
              if (v == 'reports') context.go('/reports');
              if (v == 'settings') context.go('/settings');
              if (v == 'sync') context.go('/sync');
              if (v == 'admin') context.go('/admin');
              if (v == 'manager') context.go('/manager');
              if (v == 'personnel') context.go('/personnel');
              if (v == 'logout') await ref.read(authRepoProvider).logout();
            },
            itemBuilder: (c) {
              final items = <PopupMenuEntry<String>>[
                const PopupMenuItem(value: 'analysis', child: Text('Analiz')),
                const PopupMenuItem(value: 'reports', child: Text('Raporlar')),
                const PopupMenuItem(value: 'settings', child: Text('Ayarlar')),
                const PopupMenuItem(value: 'sync', child: Text('Senkron')),
              ];

              if (role == 'admin') {
                items.add(const PopupMenuItem(value: 'admin', child: Text('Admin Paneli')));
              }
              if (role == 'manager') {
                items.add(const PopupMenuItem(value: 'manager', child: Text('Müdür Paneli')));
              }
              if (role == 'staff') {
                items.add(const PopupMenuItem(value: 'personnel', child: Text('Personel Paneli')));
              }

              items.add(const PopupMenuDivider());
              items.add(const PopupMenuItem(value: 'logout', child: Text('Çıkış')));
              return items;
            },
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
