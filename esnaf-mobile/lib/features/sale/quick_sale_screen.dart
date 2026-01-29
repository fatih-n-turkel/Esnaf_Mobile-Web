import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../data/repositories/products_repo.dart';
import '../../data/repositories/sales_repo.dart';
import '../../data/repositories/auth_repo.dart';
import '../../data/repositories/settings_repo.dart';
import '../../data/models/models.dart';
import 'cart_state.dart';
import 'widgets/product_grid.dart';
import 'widgets/cart_panel.dart';

final _searchProvider = StateProvider<String>((ref) => '');
final _categoryProvider = StateProvider<String?>((ref) => null);

final cartProvider2 = StateNotifierProvider<CartNotifier, CartState>((ref) {
  final s = ref.watch(settingsProvider);
  return CartNotifier(posFeeType: s.posFeeType, posFeeValue: s.posFeeValue);
});

class QuickSaleScreen extends ConsumerWidget {
  const QuickSaleScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.watch(productsSeedProvider);

    final query = ref.watch(_searchProvider);
    final cat = ref.watch(_categoryProvider);

    final prodRepo = ref.watch(productsRepoProvider);
    final products = prodRepo.list(query: query, category: cat);
    final categories = prodRepo.categories();

    final cart = ref.watch(cartProvider2);
    final cartN = ref.read(cartProvider2.notifier);

    return LayoutBuilder(
      builder: (context, c) {
        final wide = c.maxWidth >= 900;

        return Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            children: [
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      decoration: const InputDecoration(
                        prefixIcon: Icon(Icons.search),
                        labelText: 'Ürün ara (isim/QR)',
                      ),
                      onChanged: (v) => ref.read(_searchProvider.notifier).state = v,
                    ),
                  ),
                  const SizedBox(width: 8),
                  FilledButton.tonalIcon(
                    onPressed: () => context.go('/sale/qr'),
                    icon: const Icon(Icons.qr_code_scanner),
                    label: const Text('QR'),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              SizedBox(
                height: 44,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  children: [
                    ChoiceChip(
                      label: const Text('Tümü'),
                      selected: cat == null,
                      onSelected: (_) => ref.read(_categoryProvider.notifier).state = null,
                    ),
                    const SizedBox(width: 8),
                    ...categories.map((c) => Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: ChoiceChip(
                            label: Text(c),
                            selected: cat == c,
                            onSelected: (_) => ref.read(_categoryProvider.notifier).state = c,
                          ),
                        )),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              Expanded(
                child: wide
                    ? Row(
                        children: [
                          Expanded(
                            flex: 3,
                            child: ProductGrid(
                              products: products,
                              onTapProduct: cartN.add,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            flex: 2,
                            child: CartPanel(
                              cart: cart,
                              onInc: cartN.inc,
                              onDec: cartN.dec,
                              onClear: cartN.clear,
                              onChangePayment: cartN.setPayment,
                              onChangePosFee: cartN.setPosFee,
                              onCheckout: () => _checkout(context, ref),
                            ),
                          ),
                        ],
                      )
                    : Column(
                        children: [
                          Expanded(
                            child: ProductGrid(
                              products: products,
                              onTapProduct: cartN.add,
                            ),
                          ),
                          const SizedBox(height: 8),
                          SizedBox(
                            height: 280,
                            child: CartPanel(
                              cart: cart,
                              onInc: cartN.inc,
                              onDec: cartN.dec,
                              onClear: cartN.clear,
                              onChangePayment: cartN.setPayment,
                              onChangePosFee: cartN.setPosFee,
                              onCheckout: () => _checkout(context, ref),
                            ),
                          ),
                        ],
                      ),
              ),
            ],
          ),
        );
      },
    );
  }

  Future<void> _checkout(BuildContext context, WidgetRef ref) async {
    final cart = ref.read(cartProvider2);
    if (cart.lines.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Sepet boş')));
      return;
    }

    final auth = ref.read(authRepoProvider);
    final createdBy = auth.currentUserId ?? 'admin';

    final items = cart.lines.map((l) {
      return SaleItem(
        id: newId(),
        saleId: 'AUTO',
        productId: l.product.id,
        productName: l.product.name,
        qty: l.qty,
        unitSalePrice: l.product.salePrice,
        unitCost: l.product.costPrice,
        vatRate: l.product.vatRate,
      );
    }).toList();

    try {
      final repo = ref.read(salesRepoProvider);
      final saleId = await repo.createSale(
        items: items,
        paymentType: cart.paymentType,
        posFeeType: cart.posFeeType,
        posFeeValue: cart.posFeeValue,
        createdBy: createdBy,
      );

      ref.read(cartProvider2.notifier).clear();

      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Satış tamamlandı ✅ (id: ${saleId.substring(0, 8)}) • Toplam: ${cart.gross.toStringAsFixed(2)}'),
        ),
      );
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }
}
