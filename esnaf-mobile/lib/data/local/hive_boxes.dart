import 'package:hive/hive.dart';

class HiveBoxes {
  static const products = 'products';
  static const sales = 'sales';
  static const saleItems = 'sale_items';
  static const stockMovements = 'stock_movements';
  static const outbox = 'outbox';
  static const settings = 'settings';
  static const users = 'users';
  static const branches = 'branches';
  static const notifications = 'notifications';

  static Future<void> openAll() async {
    await Future.wait([
      Hive.openBox<Map>(products),
      Hive.openBox<Map>(sales),
      Hive.openBox<Map>(saleItems),
      Hive.openBox<Map>(stockMovements),
      Hive.openBox<Map>(outbox),
      Hive.openBox<Map>(settings),
      Hive.openBox<Map>(users),
      Hive.openBox<Map>(branches),
      Hive.openBox<Map>(notifications),
    ]);
  }

  static Box<Map> box(String name) => Hive.box<Map>(name);
}
