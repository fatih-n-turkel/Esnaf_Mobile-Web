import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/repositories/auth_repo.dart';
import '../../data/repositories/notifications_repo.dart';

class AppShell extends ConsumerWidget {
  const AppShell({super.key, required this.child});
  final Widget child;

  static const _tabs = [
    _Tab('Ana', Icons.dashboard, '/home'),
    _Tab('Satış', Icons.point_of_sale, '/sale'),
    _Tab('Ürünler', Icons.inventory_2, '/products'),
    _Tab('Stok', Icons.warehouse, '/stock'),
  ];

  int _indexForLocation(String loc, List<_Tab> tabs) {
    for (var i = 0; i < tabs.length; i++) {
      if (loc.startsWith(tabs[i].path)) {
        return i;
      }
    }
    return 0;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final role = ref.watch(authRepoProvider).getRole();
    final auth = ref.watch(authRepoProvider);
    final notifications = ref.watch(notificationsRepoProvider);
    final loc = GoRouterState.of(context).matchedLocation;
    final tabs = role == 'staff' ? _tabs.where((t) => t.path != '/home').toList() : _tabs;
    final current = _indexForLocation(loc, tabs);
    final unread = notifications.unreadCount(
      branchId: auth.getBranchId(),
      userId: auth.currentUserId,
      role: role,
    );

    return Scaffold(
      appBar: AppBar(
        title: Text('Esnaf Fast • ${role.toUpperCase()}'),
        actions: [
          IconButton(
            tooltip: 'Bildirimler',
            onPressed: () => context.go('/notifications'),
            icon: Stack(
              clipBehavior: Clip.none,
              children: [
                const Icon(Icons.notifications_none),
                if (unread > 0)
                  Positioned(
                    right: -2,
                    top: -2,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.red.shade600,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        unread.toString(),
                        style: const TextStyle(fontSize: 10, color: Colors.white),
                      ),
                    ),
                  ),
              ],
            ),
          ),
          PopupMenuButton<String>(
            onSelected: (v) async {
              if (v == 'analysis') context.go('/analysis');
              if (v == 'reports') context.go('/reports');
              if (v == 'settings') context.go('/settings');
              if (v == 'sync') context.go('/sync');
              if (v == 'admin') context.go('/admin');
              if (v == 'manager') context.go('/manager');
              if (v == 'logout') await ref.read(authRepoProvider).logout();
            },
            itemBuilder: (c) {
              final items = <PopupMenuEntry<String>>[
                if (role == 'admin' || role == 'manager')
                  const PopupMenuItem(value: 'analysis', child: Text('Analiz')),
                if (role == 'admin' || role == 'manager')
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
        destinations: tabs
            .map((t) => NavigationDestination(icon: Icon(t.icon), label: t.label))
            .toList(),
        onDestinationSelected: (i) => context.go(tabs[i].path),
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
