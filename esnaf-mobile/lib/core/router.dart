import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../features/auth/login_screen.dart';
import '../features/shell/app_shell.dart';
import '../features/home/home_screen.dart';
import '../features/sale/quick_sale_screen.dart';
import '../features/sale/qr_sale_screen.dart';
import '../features/products/products_screen.dart';
import '../features/stock/stock_screen.dart';
import '../features/reports/reports_screen.dart';
import '../features/settings/settings_screen.dart';
import '../features/sync/sync_screen.dart';
import '../features/analysis/analysis_screen.dart';
import '../features/notifications/notifications_screen.dart';
import '../features/admin/admin_screen.dart';
import '../features/manager/manager_screen.dart';
import '../features/personnel/personnel_screen.dart';

import '../data/repositories/auth_repo.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final auth = ref.watch(authRepoProvider);

  return GoRouter(
    initialLocation: '/login',
    refreshListenable: auth, // ChangeNotifier
    redirect: (context, state) {
      final loggedIn = auth.isLoggedIn;
      final goingLogin = state.matchedLocation == '/login';
      if (!loggedIn && !goingLogin) return '/login';
      if (loggedIn && goingLogin) {
        return auth.getRole() == 'system' ? '/admin' : '/home';
      }
      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),

      ShellRoute(
        builder: (context, state, child) => AppShell(child: child),
        routes: [
          GoRoute(path: '/home', builder: (c, s) => const HomeScreen()),
          GoRoute(path: '/sale', builder: (c, s) => const QuickSaleScreen()),
          GoRoute(path: '/sale/qr', builder: (c, s) => const QRSaleScreen()),
          GoRoute(path: '/products', builder: (c, s) => const ProductsScreen()),
          GoRoute(path: '/stock', builder: (c, s) => const StockScreen()),
          GoRoute(path: '/analysis', builder: (c, s) => const AnalysisScreen()),
          GoRoute(path: '/notifications', builder: (c, s) => const NotificationsScreen()),
          GoRoute(path: '/admin', builder: (c, s) => const AdminScreen()),
          GoRoute(path: '/manager', builder: (c, s) => const ManagerScreen()),
          GoRoute(path: '/personnel', builder: (c, s) => const PersonnelScreen()),
          GoRoute(path: '/reports', builder: (c, s) => const ReportsScreen()),
          GoRoute(path: '/settings', builder: (c, s) => const SettingsScreen()),
          GoRoute(path: '/sync', builder: (c, s) => const SyncScreen()),
        ],
      ),
    ],
  );
});
