import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/models.dart';

class CartLine {
  CartLine({required this.product, required this.qty});
  final Product product;
  final double qty;

  CartLine copyWith({double? qty}) => CartLine(product: product, qty: qty ?? this.qty);
}

class CartState {
  const CartState({
    required this.lines,
    required this.paymentType,
    required this.posFeeType,
    required this.posFeeValue,
  });

  final List<CartLine> lines;
  final PaymentType paymentType;
  final PosFeeType posFeeType;
  final double posFeeValue;

  double get gross => lines.fold<double>(0, (s, l) => s + (l.qty * l.product.salePrice));
  double get profitRaw => lines.fold<double>(0, (s, l) => s + (l.qty * (l.product.salePrice - l.product.costPrice)));
  double get vatTotal => lines.fold<double>(0, (s, l) {
        final lineGross = l.qty * l.product.salePrice;
        final vat = lineGross - (lineGross / (1 + l.product.vatRate));
        return s + vat;
      });

  double get posFee => paymentType == PaymentType.card
      ? (posFeeType == PosFeeType.percent ? gross * (posFeeValue / 100.0) : posFeeValue)
      : 0.0;

  double get netProfit => profitRaw - posFee;

  CartState copyWith({
    List<CartLine>? lines,
    PaymentType? paymentType,
    PosFeeType? posFeeType,
    double? posFeeValue,
  }) =>
      CartState(
        lines: lines ?? this.lines,
        paymentType: paymentType ?? this.paymentType,
        posFeeType: posFeeType ?? this.posFeeType,
        posFeeValue: posFeeValue ?? this.posFeeValue,
      );

  static CartState empty({required PosFeeType posFeeType, required double posFeeValue}) => CartState(
        lines: const [],
        paymentType: PaymentType.cash,
        posFeeType: posFeeType,
        posFeeValue: posFeeValue,
      );
}

class CartNotifier extends StateNotifier<CartState> {
  CartNotifier({required PosFeeType posFeeType, required double posFeeValue})
      : super(CartState.empty(posFeeType: posFeeType, posFeeValue: posFeeValue));

  void add(Product p) {
    final idx = state.lines.indexWhere((l) => l.product.id == p.id);
    if (idx == -1) {
      state = state.copyWith(lines: [...state.lines, CartLine(product: p, qty: 1)]);
    } else {
      final updated = [...state.lines];
      updated[idx] = updated[idx].copyWith(qty: updated[idx].qty + 1);
      state = state.copyWith(lines: updated);
    }
  }

  void inc(String productId) {
    final idx = state.lines.indexWhere((l) => l.product.id == productId);
    if (idx == -1) return;
    final updated = [...state.lines];
    updated[idx] = updated[idx].copyWith(qty: updated[idx].qty + 1);
    state = state.copyWith(lines: updated);
  }

  void dec(String productId) {
    final idx = state.lines.indexWhere((l) => l.product.id == productId);
    if (idx == -1) return;
    final updated = [...state.lines];
    final next = updated[idx].qty - 1;
    if (next <= 0) {
      updated.removeAt(idx);
    } else {
      updated[idx] = updated[idx].copyWith(qty: next);
    }
    state = state.copyWith(lines: updated);
  }

  void clear() {
    state = CartState.empty(posFeeType: state.posFeeType, posFeeValue: state.posFeeValue);
  }

  void setPayment(PaymentType t) => state = state.copyWith(paymentType: t);

  void setPosFee(PosFeeType type, double val) => state = state.copyWith(posFeeType: type, posFeeValue: val);
}

final cartProvider = StateNotifierProvider<CartNotifier, CartState>((ref) {
  // defaults from settings
  // ignore: unused_local_variable
  return CartNotifier(posFeeType: PosFeeType.percent, posFeeValue: 2.5);
});
