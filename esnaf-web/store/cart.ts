import { create } from "zustand";
import { PaymentType, PosFeeType, Product, SaleItem } from "@/lib/types";

type CartState = {
  items: SaleItem[];
  paymentType: PaymentType;
  posFeeType: PosFeeType;
  posFeeValue: number; // RATE ise 0.02, FIXED ise 5

  addProduct: (p: Product) => void;
  inc: (productId: string) => void;
  dec: (productId: string) => void;
  remove: (productId: string) => void;
  clear: () => void;

  setPaymentType: (t: PaymentType) => void;
  setPosFeeType: (t: PosFeeType) => void;
  setPosFeeValue: (v: number) => void;
};

export const useCart = create<CartState>((set, get) => ({
  items: [],
  paymentType: "CASH",
  posFeeType: "RATE",
  posFeeValue: 0.02,

  addProduct: (p) => {
    const items = [...get().items];
    const idx = items.findIndex((x) => x.productId === p.id);
    if (idx >= 0) items[idx] = { ...items[idx], qty: items[idx].qty + 1 };
    else
      items.push({
        productId: p.id,
        name: p.name,
        qty: 1,
        unitSalePrice: p.salePrice,
        unitCostPrice: p.costPrice,
        vatRate: p.vatRate,
      });
    set({ items });
  },

  inc: (id) =>
    set({
      items: get().items.map((x) => (x.productId === id ? { ...x, qty: x.qty + 1 } : x)),
    }),

  dec: (id) => {
    const items = get()
      .items.map((x) => (x.productId === id ? { ...x, qty: x.qty - 1 } : x))
      .filter((x) => x.qty > 0);
    set({ items });
  },

  remove: (id) => set({ items: get().items.filter((x) => x.productId !== id) }),
  clear: () => set({ items: [] }),

  setPaymentType: (paymentType) => set({ paymentType }),
  setPosFeeType: (posFeeType) => set({ posFeeType }),
  setPosFeeValue: (posFeeValue) => set({ posFeeValue }),
}));
