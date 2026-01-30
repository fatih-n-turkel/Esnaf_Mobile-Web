"use client";

import { useMemo, useState } from "react";
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
  const [selectedCategory, setSelectedCategory] = useState<string>("Tümü");

  const categories = useMemo(() => {
    const unique = new Set(
      products.map((product) => product.category?.trim()).filter((category): category is string => Boolean(category)),
    );
    const list = Array.from(unique).sort((a, b) => a.localeCompare(b, "tr"));
    if (products.some((product) => !product.category?.trim())) {
      list.push("Diğer");
    }
    return ["Tümü", ...list];
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "Tümü") {
      return products;
    }
    return products.filter((product) => (product.category?.trim() ?? "Diğer") === selectedCategory);
  }, [products, selectedCategory]);

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

        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const isActive = category === selectedCategory;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={[
                  "rounded-full border px-3 py-1 text-sm transition",
                  isActive ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-white hover:border-zinc-400",
                ].join(" ")}
              >
                {category}
              </button>
            );
          })}
        </div>

        <ProductGrid products={filteredProducts} onPick={cart.addProduct} />
      </div>

      <CartPanel onCheckout={checkout} />
    </div>
  );
}
