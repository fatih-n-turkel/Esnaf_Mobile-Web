import 'package:flutter/material.dart';
import '../../../data/models/models.dart';
import '../cart_state.dart';

class CartPanel extends StatelessWidget {
  const CartPanel({
    super.key,
    required this.cart,
    required this.onInc,
    required this.onDec,
    required this.onClear,
    required this.onChangePayment,
    required this.onCheckout,
    required this.showBreakdown,
  });

  final CartState cart;
  final void Function(String productId) onInc;
  final void Function(String productId) onDec;
  final VoidCallback onClear;
  final void Function(PaymentType) onChangePayment;
  final VoidCallback onCheckout;
  final bool showBreakdown;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            Row(
              children: [
                const Expanded(
                  child: Text('Sepet', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                ),
                TextButton.icon(onPressed: onClear, icon: const Icon(Icons.delete_outline), label: const Text('Temizle')),
              ],
            ),
            const SizedBox(height: 8),
            if (cart.lines.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 24),
                child: Center(child: Text('Sepet boş')),
              )
            else
              ..._buildLineItems(cart, onInc, onDec),
            const SizedBox(height: 8),
            SegmentedButton<PaymentType>(
              segments: const [
                ButtonSegment(value: PaymentType.cash, label: Text('Nakit'), icon: Icon(Icons.payments_outlined)),
                ButtonSegment(value: PaymentType.card, label: Text('Kart'), icon: Icon(Icons.credit_card)),
              ],
              selected: {cart.paymentType},
              onSelectionChanged: (s) => onChangePayment(s.first),
            ),
            const SizedBox(height: 10),
            if (showBreakdown) ...[
              _TotalsRow(label: 'KDV', value: cart.vatTotal),
              _TotalsRow(label: 'Net Kâr', value: cart.netProfit),
            ],
            _TotalsRow(label: 'Toplam', value: cart.gross, bold: true),
            const SizedBox(height: 10),
            FilledButton.icon(
              onPressed: onCheckout,
              icon: const Icon(Icons.check_circle_outline),
              label: const Text('Satışı Tamamla'),
            ),
          ],
        ),
      ),
    );
  }
}

List<Widget> _buildLineItems(CartState cart, void Function(String) onInc, void Function(String) onDec) {
  final items = <Widget>[];
  for (var i = 0; i < cart.lines.length; i++) {
    final l = cart.lines[i];
    items.add(
      Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(l.product.name, maxLines: 1, overflow: TextOverflow.ellipsis),
                Text('₺${l.product.salePrice.toStringAsFixed(2)}', style: const TextStyle(fontSize: 12)),
              ],
            ),
          ),
          IconButton(onPressed: () => onDec(l.product.id), icon: const Icon(Icons.remove_circle_outline)),
          Text('${l.qty.toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.bold)),
          IconButton(onPressed: () => onInc(l.product.id), icon: const Icon(Icons.add_circle_outline)),
        ],
      ),
    );
    if (i != cart.lines.length - 1) {
      items.add(const Divider(height: 12));
    }
  }
  return items;
}

class _TotalsRow extends StatelessWidget {
  const _TotalsRow({required this.label, required this.value, this.bold = false});
  final String label;
  final double value;
  final bool bold;

  @override
  Widget build(BuildContext context) {
    final style = TextStyle(fontWeight: bold ? FontWeight.w700 : FontWeight.w400);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          Expanded(child: Text(label, style: style)),
          Text('₺${value.toStringAsFixed(2)}', style: style),
        ],
      ),
    );
  }
}
