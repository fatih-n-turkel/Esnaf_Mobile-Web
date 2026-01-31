"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ProductGrid from "@/components/sales/product-grid";
import CartPanel from "@/components/sales/cart-panel";
import { useCart } from "@/store/cart";
import { Product } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "@/store/auth";

async function fetchProducts() {
  const r = await fetch("/api/products", { cache: "no-store" });
  return r.json();
}

export default function QuickSalesPage() {
  const qc = useQueryClient();
  const cart = useCart();
  const { data } = useQuery({ queryKey: ["products"], queryFn: fetchProducts });
  const products: Product[] = data?.items ?? [];
  const user = useAuth((state) => state.user);
  const [selectedCategory, setSelectedCategory] = useState<string>("Tümü");
  const [mode, setMode] = useState<"MANUAL" | "QR">("MANUAL");
  const [scanValue, setScanValue] = useState("");
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [scanHistory, setScanHistory] = useState<Array<{ code: string; name: string; at: string }>>([]);

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
      createdBy: {
        id: user?.id ?? "demo-user",
        name: user?.name ?? "Demo",
        role: user?.role ?? "PERSONEL",
      },
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

  function handleScanSubmit() {
    const code = scanValue.trim();
    if (!code) return;
    const found = products.find((p) => p.qrCode?.toLowerCase() === code.toLowerCase());
    if (!found) {
      setScanMessage("QR eşleşmedi. Ürün bulunamadı.");
      setScanValue("");
      return;
    }
    cart.addProduct(found);
    setScanHistory((prev) =>
      [{ code, name: found.name, at: new Date().toLocaleTimeString("tr-TR") }, ...prev].slice(0, 6)
    );
    setScanMessage(`${found.name} sepete eklendi.`);
    setScanValue("");
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-4">
      <div className="space-y-3">
        <div>
          <h1 className="text-xl font-semibold">Hızlı Satış</h1>
          <p className="text-sm text-zinc-500">Satış tamamlandığında stoklar otomatik güncellenir.</p>
        </div>

        <div className="rounded-2xl border bg-white p-3 shadow-sm space-y-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setMode("MANUAL")}
              className={[
                "rounded-full border px-3 py-1 text-sm",
                mode === "MANUAL"
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white hover:border-zinc-400",
              ].join(" ")}
            >
              Manuel Satış
            </button>
            <button
              type="button"
              onClick={() => setMode("QR")}
              className={[
                "rounded-full border px-3 py-1 text-sm",
                mode === "QR"
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white hover:border-zinc-400",
              ].join(" ")}
            >
              QR Kod ile Satış
            </button>
          </div>
          <div className="text-xs text-zinc-500">
            Manuel satışta ürünleri kartlardan seçin; QR modunda okutulan her kod otomatik sepete eklenir.
          </div>
        </div>

        {mode === "MANUAL" ? (
          <>
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
          </>
        ) : (
          <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
            <div className="font-medium">QR Okutma</div>
            <input
              className="w-full rounded-lg border px-3 py-2 text-sm"
              placeholder="QR okuyucu ile okutun veya kodu yazıp Enter'a basın"
              value={scanValue}
              onChange={(event) => setScanValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleScanSubmit();
                }
              }}
            />
            {scanMessage && <div className="text-xs text-zinc-500">{scanMessage}</div>}
            <div className="rounded-xl border bg-zinc-50 p-3 text-xs text-zinc-500 space-y-1">
              <div>Hızlı satış akışı (kasada minimum tıklama) için QR okutma önerilir.</div>
              <div>Okutulan değer ürünün QR kodu ile eşleştirilerek satışa eklenir.</div>
            </div>
            <div className="space-y-1 text-xs text-zinc-500">
              <div className="font-medium text-zinc-700">Son okutmalar</div>
              {scanHistory.map((entry) => (
                <div key={`${entry.code}-${entry.at}`} className="flex items-center justify-between">
                  <span>{entry.name}</span>
                  <span>{entry.at}</span>
                </div>
              ))}
              {!scanHistory.length && <div>Henüz okutma yok.</div>}
            </div>
          </div>
        )}
      </div>

      <CartPanel onCheckout={checkout} />
    </div>
  );
}
