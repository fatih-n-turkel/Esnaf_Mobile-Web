import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/repositories/products_repo.dart';
import '../../data/models/models.dart';
import 'quick_sale_screen.dart';

class QRSaleScreen extends ConsumerStatefulWidget {
  const QRSaleScreen({super.key});

  @override
  ConsumerState<QRSaleScreen> createState() => _QRSaleScreenState();
}

class _QRSaleScreenState extends ConsumerState<QRSaleScreen> {
  String? last;

  @override
  Widget build(BuildContext context) {
    if (kIsWeb) {
      return Scaffold(
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.qr_code_scanner, size: 64),
                const SizedBox(height: 12),
                const Text('Web’de QR kamera izinleri tarayıcıya bağlıdır.'),
                const SizedBox(height: 8),
                Text('Son: ${last ?? '-'}'),
                const SizedBox(height: 12),
                const Text('Mobilde daha stabil çalışır.'),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      body: MobileScanner(
        onDetect: (capture) {
          final codes = capture.barcodes;
          if (codes.isEmpty) return;
          final v = codes.first.rawValue;
          if (v == null) return;
          if (v == last) return;
          setState(() => last = v);

          // MVP: QR value match by qrValue contains
          final repo = ref.read(productsRepoProvider);
          final products = repo.list();
          Product? found;
          for (final p in products) {
            if (p.qrValue == v || v.contains(p.qrValue) || p.qrValue.contains(v)) {
              found = p;
              break;
            }
          }
          if (found != null) {
            ref.read(cartProvider2.notifier).add(found);
            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Eklendi: ${found.name}')));
          } else {
            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Ürün bulunamadı: $v')));
          }
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => Navigator.of(context).pop(),
        icon: const Icon(Icons.check),
        label: const Text('Satışa Dön'),
      ),
    );
  }
}
