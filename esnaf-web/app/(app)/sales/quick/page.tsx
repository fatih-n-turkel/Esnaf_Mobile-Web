"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import ProductGrid from "@/components/sales/product-grid";
import CartPanel from "@/components/sales/cart-panel";
import { useCart } from "@/store/cart";
import { Product } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

async function fetchProducts() {
  const r = await fetch("/api/products", { cache: "no-store" });
  return r.json();
}

export default function QuickSalesPage() {
  const qc = useQueryClient();
  const cart = useCart();
  const { data } = useQuery({ queryKey: ["products"], queryFn: fetchProducts });
  const products: Product[] = data?.items ?? [];

  async function checkout() {
    const clientRequestId = uuidv4();

    const payload = {
      clientRequestId,
      createdBy: { id: "demo-user-1", name: "Demo Müdür", role: "MANAGER" },
      paymentType: cart.paymentType,
      posFeeType: cart.posFeeType,
      posFeeValue: cart.posFeeValue,
      items: cart.items,
    };

    const r = await fetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      alert(e?.error ?? "Satış kaydedilemedi");
      return;
    }

    cart.clear();
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["sales"] }),
      qc.invalidateQueries({ queryKey: ["products"] }),
    ]);

    alert("Satış tamamlandı ✅");
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-4">
      <div className="space-y-3">
        <div>
          <h1 className="text-xl font-semibold">Hızlı Satış</h1>
          <p className="text-sm text-zinc-500">Ürün seç → ödeme → tamamla (3 tık).</p>
        </div>

        <ProductGrid products={products} onPick={cart.addProduct} />
      </div>

      <CartPanel onCheckout={checkout} />
    </div>
  );
}
