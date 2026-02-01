"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ProductGrid from "@/components/sales/product-grid";
import CartPanel from "@/components/sales/cart-panel";
import { useCart } from "@/store/cart";
import { Branch, Product, Settings } from "@/lib/types";
import { getBranchStock } from "@/lib/branches";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "@/store/auth";
import { withBusinessId } from "@/lib/tenant";

async function fetchProducts(businessId?: string | null) {
  const r = await fetch(withBusinessId("/api/products", businessId), { cache: "no-store" });
  return r.json();
}

async function fetchBranches(businessId?: string | null) {
  const r = await fetch(withBusinessId("/api/branches", businessId), { cache: "no-store" });
  return r.json();
}

async function fetchSettings(businessId?: string | null) {
  const r = await fetch(withBusinessId("/api/settings", businessId), { cache: "no-store" });
  return r.json();
}

export default function QuickSalesPage() {
  const qc = useQueryClient();
  const cart = useCart();
  const user = useAuth((state) => state.user);
  const businessId = user?.role === "YONETIM" ? null : user?.businessId ?? null;
  const { data } = useQuery({
    queryKey: ["products", businessId],
    queryFn: () => fetchProducts(businessId),
  });
  const { data: branchData } = useQuery({
    queryKey: ["branches", businessId],
    queryFn: () => fetchBranches(businessId),
  });
  const { data: settingsData } = useQuery({
    queryKey: ["settings", businessId],
    queryFn: () => fetchSettings(businessId),
  });
  const products: Product[] = data?.items ?? [];
  const branches: Branch[] = branchData?.items ?? [];
  const settings: Settings | undefined = settingsData?.item;
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const branchId = user?.role === "ADMİN" ? selectedBranchId : user?.branchId ?? null;
  const [selectedCategory, setSelectedCategory] = useState<string>("Tümü");
  const [mode, setMode] = useState<"MANUAL" | "QR">("MANUAL");
  const [scanValue, setScanValue] = useState("");
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [scanHistory, setScanHistory] = useState<Array<{ code: string; name: string; at: string }>>([]);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraStatus, setCameraStatus] = useState<"idle" | "starting" | "active" | "unsupported">("idle");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastCameraScanRef = useRef<{ code: string; at: number } | null>(null);
  const posFeeInitRef = useRef(false);

  useEffect(() => {
    if (user?.role === "ADMİN" && !selectedBranchId && branches.length > 0) {
      setSelectedBranchId(branches[0].id);
    }
  }, [branches, selectedBranchId, user?.role]);

  useEffect(() => {
    if (!settings || posFeeInitRef.current) return;
    cart.setPosFeeType(settings.posFeeType);
    cart.setPosFeeValue(settings.posFeeValue);
    posFeeInitRef.current = true;
  }, [cart, settings]);

  const branchProducts = useMemo(
    () => products.map((p) => ({ ...p, stockOnHand: getBranchStock(p, branchId) })),
    [products, branchId]
  );

  const categories = useMemo(() => {
    const unique = new Set(
      branchProducts.map((product) => product.category?.trim()).filter((category): category is string => Boolean(category)),
    );
    const list = Array.from(unique).sort((a, b) => a.localeCompare(b, "tr"));
    if (branchProducts.some((product) => !product.category?.trim())) {
      list.push("Diğer");
    }
    return ["Tümü", ...list];
  }, [branchProducts]);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "Tümü") {
      return branchProducts;
    }
    return branchProducts.filter((product) => (product.category?.trim() ?? "Diğer") === selectedCategory);
  }, [branchProducts, selectedCategory]);

  async function checkout() {
    const clientRequestId = uuidv4();

    const payload = {
      clientRequestId,
      businessId,
      createdBy: {
        id: user?.id ?? "demo-user",
        name: user?.name ?? "Demo",
        role: user?.role ?? "PERSONEL",
      },
      branchId,
      paymentType: cart.paymentType,
      posFeeType: cart.posFeeType,
      posFeeValue: cart.posFeeValue,
      items: cart.items,
    };

    const r = await fetch(withBusinessId("/api/sales", businessId), {
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
      qc.invalidateQueries({ queryKey: ["sales", businessId] }),
      qc.invalidateQueries({ queryKey: ["products", businessId] }),
    ]);

    alert("Satış tamamlandı ✅");
  }

  const handleScannedCode = useCallback(
    (raw: string, source: "manual" | "camera") => {
      const code = raw.trim();
      if (!code) return;
      if (source === "camera") {
        const last = lastCameraScanRef.current;
        if (last && last.code === code && Date.now() - last.at < 1500) {
          return;
        }
        lastCameraScanRef.current = { code, at: Date.now() };
      }
      const found = branchProducts.find((p) => p.qrCode?.toLowerCase() === code.toLowerCase());
      if (!found) {
        setScanMessage("QR eşleşmedi. Ürün bulunamadı.");
        return;
      }
      cart.addProduct(found);
      setScanHistory((prev) =>
        [{ code, name: found.name, at: new Date().toLocaleTimeString("tr-TR") }, ...prev].slice(0, 6)
      );
      setScanMessage(`${found.name} sepete eklendi.`);
    },
    [cart, branchProducts],
  );

  function handleScanSubmit() {
    const code = scanValue.trim();
    if (!code) return;
    handleScannedCode(code, "manual");
    setScanValue("");
  }

  useEffect(() => {
    const supports = typeof window !== "undefined" && "BarcodeDetector" in window && !!navigator?.mediaDevices;
    if (mode !== "QR") {
      setCameraStatus("idle");
      setCameraError(null);
      lastCameraScanRef.current = null;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      return;
    }

    if (!supports) {
      setCameraStatus("unsupported");
      setCameraError("Tarayıcı kamera taramasını desteklemiyor.");
      return;
    }

    let active = true;
    lastCameraScanRef.current = null;
    const startCamera = async () => {
      setCameraStatus("starting");
      setCameraError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (!active) return;
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setCameraStatus("active");
        const detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
        const tick = async () => {
          if (!active) return;
          if (videoRef.current && videoRef.current.readyState >= 2) {
            try {
              const barcodes = await detector.detect(videoRef.current);
              if (barcodes?.length) {
                const value = barcodes[0]?.rawValue ?? barcodes[0]?.displayValue ?? "";
                if (value) {
                  setScanValue(value);
                  handleScannedCode(value, "camera");
                }
              }
            } catch (err) {
              setCameraError("QR taraması sırasında hata oluştu.");
            }
          }
          frameRef.current = requestAnimationFrame(tick);
        };
        frameRef.current = requestAnimationFrame(tick);
      } catch (err) {
        setCameraStatus("unsupported");
        setCameraError("Kamera izni verilemedi.");
      }
    };

    startCamera();

    return () => {
      active = false;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [handleScannedCode, mode]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-4">
      <div className="space-y-3">
        <div>
          <h1 className="text-xl font-semibold">Hızlı Satış</h1>
          <p className="text-sm text-zinc-500">Satış tamamlandığında stoklar otomatik güncellenir.</p>
        </div>

        {user?.role === "ADMİN" && (
          <div className="rounded-2xl border bg-white p-3 shadow-sm space-y-2">
            <div className="text-xs font-medium text-zinc-700">Bayi seçimi (sadece admin)</div>
            <select
              className="w-full rounded-lg border px-3 py-2 text-sm"
              value={selectedBranchId ?? ""}
              onChange={(event) => setSelectedBranchId(event.target.value || null)}
            >
              <option value="">Bayi seçin</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
        )}

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
            <div className="rounded-xl border bg-zinc-50 p-3 space-y-2">
              <div className="text-xs font-medium text-zinc-700">Kamera ile okutma</div>
              {cameraStatus === "unsupported" ? (
                <div className="text-xs text-zinc-500">Tarayıcı kamera taramasını desteklemiyor.</div>
              ) : (
                <video
                  ref={videoRef}
                  className="w-full rounded-lg border bg-black/90 aspect-video"
                  muted
                  playsInline
                />
              )}
              {cameraError && <div className="text-xs text-rose-600">{cameraError}</div>}
              {cameraStatus === "starting" && <div className="text-xs text-zinc-500">Kamera hazırlanıyor...</div>}
            </div>
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
