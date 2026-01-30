import { create } from "zustand";
import { PaymentType, PosFeeType, Product, SaleItem } from "@/lib/types";

type CartState = {
  items: SaleItem[];
  paymentType: PaymentType;
  posFeeType: PosFeeType;
  posFeeValue: number; // RATE ise 0.02, FIXED ise 5
  warning: string | null;

  addProduct: (p: Product) => void;
  inc: (productId: string) => void;
  dec: (productId: string) => void;
  remove: (productId: string) => void;
  clear: () => void;
  clearWarning: () => void;

  setPaymentType: (t: PaymentType) => void;
  setPosFeeType: (t: PosFeeType) => void;
  setPosFeeValue: (v: number) => void;
};

export const useCart = create<CartState>((set, get) => ({
  items: [],
  paymentType: "CASH",
  posFeeType: "RATE",
  posFeeValue: 0.02,
  warning: null,

  addProduct: (p) => {
    const items = [...get().items];
    const idx = items.findIndex((x) => x.productId === p.id);
    if (idx >= 0) {
      const current = items[idx];
      const max = current.maxStock ?? p.stockOnHand;
      if (current.qty >= max) {
        set({ warning: `${p.name} için stok yetersiz. Maksimum ${max} adet eklenebilir.` });
        return;
      }
      items[idx] = { ...current, qty: current.qty + 1, maxStock: max };
    } else {
      if (p.stockOnHand <= 0) {
        set({ warning: `${p.name} için stok bulunmuyor.` });
        return;
      }
      items.push({
        productId: p.id,
        name: p.name,
        qty: 1,
        unitSalePrice: p.salePrice,
        unitCostPrice: p.costPrice,
        vatRate: p.vatRate,
        maxStock: p.stockOnHand,
      });
    }
    set({ items, warning: null });
  },

  inc: (id) => {
    let warning: string | null = null;
    const items = get().items.map((x) => {
      if (x.productId !== id) return x;
      const max = x.maxStock ?? x.qty;
      if (x.qty >= max) {
        warning = `${x.name} için stok sınırı aşılamaz. Maksimum ${max} adet.`;
        return x;
      }
      return { ...x, qty: x.qty + 1, maxStock: max };
    });
    set({ items, warning });
  },

  dec: (id) => {
    const items = get()
      .items.map((x) => (x.productId === id ? { ...x, qty: x.qty - 1 } : x))
      .filter((x) => x.qty > 0);
    set({ items, warning: null });
  },

  remove: (id) => set({ items: get().items.filter((x) => x.productId !== id), warning: null }),
  clear: () => set({ items: [], warning: null }),
  clearWarning: () => set({ warning: null }),

  setPaymentType: (paymentType) => set({ paymentType }),
  setPosFeeType: (posFeeType) => set({ posFeeType }),
  setPosFeeValue: (posFeeValue) => set({ posFeeValue }),
}));
