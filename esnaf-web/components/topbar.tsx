"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { analyticsPeriods, calcAnalyticsForPeriod } from "@/lib/analytics";
import { fmtTRY } from "@/lib/money";
import { DemoUser, Product, Sale } from "@/lib/types";
import { getDemoUsers, roleLabel } from "@/lib/auth";
import { useAuth } from "@/store/auth";

async function fetchProducts() {
  const r = await fetch("/api/products", { cache: "no-store" });
  return r.json();
}

async function fetchSales() {
  const r = await fetch("/api/sales", { cache: "no-store" });
  return r.json();
}

export default function Topbar() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Product | null>(null);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [people, setPeople] = useState<DemoUser[]>([]);
  const user = useAuth((state) => state.user);
  const logout = useAuth((state) => state.logout);

  const { data: productData } = useQuery({ queryKey: ["products"], queryFn: fetchProducts });
  const { data: salesData } = useQuery({ queryKey: ["sales"], queryFn: fetchSales });

  const products: Product[] = productData?.items ?? [];
  const sales: Sale[] = salesData?.items ?? [];
  const canSeePersonnel = user?.role === "ADMİN" || user?.role === "MÜDÜR";

  useEffect(() => {
    let active = true;
    getDemoUsers().then((list) => {
      if (active) setPeople(list);
    });
    return () => {
      active = false;
    };
  }, []);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 6);
  }, [products, query]);

  const personMatches = useMemo(() => {
    if (!canSeePersonnel) return [];
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return people
      .filter((person) => person.role !== "ADMİN")
      .filter(
        (person) =>
          person.name.toLowerCase().includes(q) ||
          person.username.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [canSeePersonnel, people, query]);

  const selectedPerson = useMemo(() => {
    if (!selectedPersonId) return null;
    return people.find((person) => person.id === selectedPersonId) ?? null;
  }, [people, selectedPersonId]);

  const personSales = useMemo(() => {
    if (!selectedPerson) return [];
    return sales.filter((sale) => sale.createdBy.id === selectedPerson.id);
  }, [sales, selectedPerson]);

  const analytics = useMemo(() => {
    if (!selected) return [];
    return analyticsPeriods.map((period) => ({
      period,
      summary: calcAnalyticsForPeriod(sales, period, selected.id),
    }));
  }, [sales, selected]);

  const personAnalytics = useMemo(() => {
    if (!selectedPerson) return [];
    return analyticsPeriods.map((period) => ({
      period,
      summary: calcAnalyticsForPeriod(personSales, period),
    }));
  }, [personSales, selectedPerson]);

  return (
    <header className="sticky top-0 z-10 bg-white border-b">
      <div className="flex flex-col gap-2 p-3 md:p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="relative w-full max-w-xl">
            <input
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900"
              placeholder="Ara"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setSelected(null);
                setSelectedPersonId(null);
              }}
            />
            {(matches.length > 0 || personMatches.length > 0) &&
              (!selected || query !== selected.name) &&
              (!selectedPerson || query !== selectedPerson.name) && (
              <div className="absolute z-20 mt-2 w-full rounded-xl border bg-white shadow-lg overflow-hidden">
                {matches.length > 0 && (
                  <div className="border-b">
                    <div className="px-3 py-2 text-[11px] uppercase tracking-wide text-zinc-500">Ürünler</div>
                    {matches.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => {
                          setSelected(product);
                          setSelectedPersonId(null);
                          setQuery(product.name);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-50"
                      >
                        <div className="font-medium">{product.name}</div>
                        <div className="text-xs text-zinc-500">
                          {product.category ?? "Kategori yok"} • Stok {product.stockOnHand}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {personMatches.length > 0 && (
                  <div>
                    <div className="px-3 py-2 text-[11px] uppercase tracking-wide text-zinc-500">Personel</div>
                    {personMatches.map((person) => (
                      <button
                        key={person.id}
                        type="button"
                        onClick={() => {
                          setSelected(null);
                          setSelectedPersonId(person.id);
                          setQuery(person.name);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-50"
                      >
                        <div className="font-medium">{person.name}</div>
                        <div className="text-xs text-zinc-500">
                          @{person.username} • {roleLabel(person.role)}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-zinc-500 whitespace-nowrap">
            <div>
              Kullanıcı: <span className="font-medium text-zinc-900">{user?.name ?? "-"}</span>
              <span className="ml-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-600">
                {user?.role ? roleLabel(user.role) : "Misafir"}
              </span>
            </div>
            <button onClick={logout} className="text-xs text-zinc-500 hover:text-zinc-900">
              Çıkış
            </button>
          </div>
        </div>

        {selected && (
          <div className="rounded-2xl border bg-zinc-50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">{selected.name}</div>
                <div className="text-xs text-zinc-500">
                  {selected.category ?? "Kategori yok"} • Stok {selected.stockOnHand} • Kritik{" "}
                  {selected.criticalStockLevel}
                </div>
              </div>
              <div className="text-xs text-zinc-500">
                Satış: <span className="font-medium text-zinc-900">{fmtTRY(selected.salePrice)}</span> • Maliyet:{" "}
                <span className="font-medium text-zinc-900">{fmtTRY(selected.costPrice)}</span> • KDV{" "}
                {(selected.vatRate * 100).toFixed(0)}%
              </div>
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-5">
              {analytics.map(({ period, summary }) => (
                <div key={period.key} className="rounded-xl border bg-white px-3 py-2 text-xs">
                  <div className="font-medium">{period.label}</div>
                  <div className="text-zinc-500 mt-1">Ciro: {fmtTRY(summary.revenue)}</div>
                  <div className="text-zinc-500">Kâr: {fmtTRY(summary.profit)}</div>
                  <div className="text-zinc-500">Zarar: {fmtTRY(summary.loss)}</div>
                  <div className="text-zinc-500">Satış: {summary.soldQty} adet</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedPerson && (
          <div className="rounded-2xl border bg-zinc-50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">{selectedPerson.name}</div>
                <div className="text-xs text-zinc-500">
                  @{selectedPerson.username} • {roleLabel(selectedPerson.role)}
                </div>
              </div>
              <div className="text-xs text-zinc-500">
                Toplam satış: <span className="font-medium text-zinc-900">{personSales.length}</span>
              </div>
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-5">
              {personAnalytics.map(({ period, summary }) => (
                <div key={period.key} className="rounded-xl border bg-white px-3 py-2 text-xs">
                  <div className="font-medium">{period.label}</div>
                  <div className="text-zinc-500 mt-1">Ciro: {fmtTRY(summary.revenue)}</div>
                  <div className="text-zinc-500">Kâr: {fmtTRY(summary.profit)}</div>
                  <div className="text-zinc-500">Zarar: {fmtTRY(summary.loss)}</div>
                  <div className="text-zinc-500">Satış: {summary.soldQty} adet</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
