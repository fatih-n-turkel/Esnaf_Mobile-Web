import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/repositories/products_repo.dart';
import '../../data/repositories/auth_repo.dart';
import '../../data/models/models.dart';
import 'quick_sale_screen.dart';

class QRSaleScreen extends ConsumerStatefulWidget {
  const QRSaleScreen({super.key});

  @override
  ConsumerState<QRSaleScreen> createState() => _QRSaleScreenState();
}

class _QRSaleScreenState extends ConsumerState<QRSaleScreen> {
  String? last;
  String? message;
  final List<_ScanEntry> history = [];

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
                if (message != null) Text(message!),
                const SizedBox(height: 6),
                Text('Son: ${last ?? '-'}'),
                const SizedBox(height: 6),
                ...history.take(4).map((entry) => Text('${entry.name} • ${entry.at}')),
                const SizedBox(height: 12),
                const Text('Mobilde daha stabil çalışır.'),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      body: Stack(
        children: [
          MobileScanner(
            onDetect: (capture) {
              final codes = capture.barcodes;
              if (codes.isEmpty) return;
              final v = codes.first.rawValue;
              if (v == null) return;
              if (v == last) return;

              final normalized = v.trim().toLowerCase();
              final branchId = ref.read(authRepoProvider).getBranchId();
              final businessId = ref.read(authRepoProvider).getBusinessId();
              final repo = ref.read(productsRepoProvider);
              final products = repo.list(branchId: branchId, businessId: businessId);
              Product? found;
              for (final p in products) {
                if (p.qrValue.trim().toLowerCase() == normalized) {
                  found = p;
                  break;
                }
              }

              setState(() {
                last = v;
                if (found != null) {
                  message = '${found.name} sepete eklendi.';
                  history.insert(0, _ScanEntry(name: found!.name, at: TimeOfDay.now().format(context)));
                  if (history.length > 6) history.removeLast();
                } else {
                  message = 'Ürün bulunamadı: $v';
                }
              });

              if (found != null) {
                ref.read(cartProvider2.notifier).add(found);
              }
            },
          ),
          Align(
            alignment: Alignment.bottomCenter,
            child: SafeArea(
              child: Container(
                margin: const EdgeInsets.all(12),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.9),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('QR Okutma', style: TextStyle(fontWeight: FontWeight.w700)),
                    const SizedBox(height: 4),
                    const Text(
                      'Okutulan her kod ürünle eşleştirilerek sepete eklenir.',
                      style: TextStyle(fontSize: 12, color: Colors.black54),
                    ),
                    if (message != null) ...[
                      const SizedBox(height: 6),
                      Text(message!, style: const TextStyle(fontSize: 12)),
                    ],
                    const SizedBox(height: 6),
                    const Text('Son okutmalar', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                    if (history.isEmpty)
                      const Text('Henüz okutma yok.', style: TextStyle(fontSize: 12, color: Colors.black54))
                    else
                      ...history
                          .map((entry) => Text('${entry.name} • ${entry.at}',
                              style: const TextStyle(fontSize: 12, color: Colors.black54)))
                          .toList(),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => Navigator.of(context).pop(),
        icon: const Icon(Icons.check),
        label: const Text('Satışa Dön'),
      ),
    );
  }
}

class _ScanEntry {
  const _ScanEntry({required this.name, required this.at});
  final String name;
  final String at;
}
