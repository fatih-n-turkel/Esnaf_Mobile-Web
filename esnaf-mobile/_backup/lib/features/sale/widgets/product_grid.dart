import 'package:flutter/material.dart';
import '../../../data/models/models.dart';

class ProductGrid extends StatelessWidget {
  const ProductGrid({super.key, required this.products, required this.onTapProduct});

  final List<Product> products;
  final void Function(Product) onTapProduct;

  @override
  Widget build(BuildContext context) {
    if (products.isEmpty) {
      return const Center(child: Text('Ürün yok'));
    }
    return GridView.builder(
      gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
        maxCrossAxisExtent: 180,
        mainAxisSpacing: 8,
        crossAxisSpacing: 8,
        childAspectRatio: 1.2,
      ),
      itemCount: products.length,
      itemBuilder: (context, i) {
        final p = products[i];
        final critical = p.stockQty <= p.criticalStock;
        return InkWell(
          onTap: () => onTapProduct(p),
          borderRadius: BorderRadius.circular(16),
          child: Card(
            child: Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          p.name,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontWeight: FontWeight.w600),
                        ),
                      ),
                      if (critical) const Icon(Icons.warning_amber, size: 18),
                    ],
                  ),
                  const Spacer(),
                  Text('₺${p.salePrice.toStringAsFixed(2)}', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text('Stok: ${p.stockQty}', style: TextStyle(color: critical ? Colors.red : null)),
                  const SizedBox(height: 6),
                  Align(
                    alignment: Alignment.bottomRight,
                    child: FilledButton.tonal(
                      onPressed: () => onTapProduct(p),
                      child: const Text('+1'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
