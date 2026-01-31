"use client";

import { useCart } from "@/store/cart";
import { useAuth } from "@/store/auth";
import { calcSaleTotals, fmtTRY } from "@/lib/money";

export default function CartPanel({ onCheckout }: { onCheckout: () => Promise<void> }) {
  const cart = useCart();
  const user = useAuth((state) => state.user);
  const isPersonnel = user?.role === "PERSONEL";
  const totals = calcSaleTotals(cart.items, cart.paymentType, cart.posFeeType, cart.posFeeValue);

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm sticky top-20">
      <div className="flex items-center justify-between">
        <div className="font-semibold">Sepet</div>
        <button onClick={() => cart.clear()} className="text-xs text-zinc-500 hover:text-zinc-900">
          Temizle
        </button>
      </div>

      <div className="mt-3 space-y-2">
        {cart.items.map((it) => (
          <div key={it.productId} className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{it.name}</div>
              <div className="text-xs text-zinc-500">
                {fmtTRY(it.unitSalePrice)} • KDV {(it.vatRate * 100).toFixed(0)}%
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => cart.dec(it.productId)} className="h-8 w-8 rounded-lg border hover:bg-zinc-50">
                -
              </button>
              <div className="w-8 text-center text-sm">{it.qty}</div>
              <button onClick={() => cart.inc(it.productId)} className="h-8 w-8 rounded-lg border hover:bg-zinc-50">
                +
              </button>
            </div>
          </div>
        ))}
        {cart.warning && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            {cart.warning}
          </div>
        )}
        {!cart.items.length && <div className="text-sm text-zinc-500 py-6">Ürün seçerek başlayın.</div>}
      </div>

      <div className="mt-4 border-t pt-4 space-y-2">
        <div className="text-sm font-medium">Ödeme</div>
        <div className="grid grid-cols-2 gap-2">
          {(["CASH", "CARD"] as const).map((t) => (
            <button
              key={t}
              onClick={() => cart.setPaymentType(t)}
              className={[
                "rounded-2xl border px-3 py-3 text-sm font-medium flex items-center justify-center gap-2 transition",
                cart.paymentType === t
                  ? "bg-zinc-900 text-white border-zinc-900 shadow-sm"
                  : "bg-white hover:bg-zinc-50 border-zinc-200",
              ].join(" ")}
            >
              <span className="text-base">{t === "CASH" ? "💵" : "💳"}</span>
              {t === "CASH" ? "Nakit" : t === "CARD" ? "Kart" : ""}
            </button>
          ))}
        </div>

        {!isPersonnel && (
          <>
            <div className="text-sm flex justify-between">
              <span>Ciro</span>
              <b>{fmtTRY(totals.totalRevenue)}</b>
            </div>
            <div className="text-sm flex justify-between">
              <span>Maliyet</span>
              <span>{fmtTRY(totals.totalCost)}</span>
            </div>
            <div className="text-sm flex justify-between">
              <span>KDV</span>
              <span>{fmtTRY(totals.totalVat)}</span>
            </div>
            <div className="text-sm flex justify-between">
              <span>Net Kâr</span>
              <span>{fmtTRY(totals.netProfit)}</span>
            </div>
          </>
        )}
        <div className="text-base flex justify-between border-t pt-2">
          <span>Toplam</span>
          <b>{fmtTRY(totals.totalRevenue)}</b>
        </div>

        <button
          disabled={!cart.items.length}
          onClick={onCheckout}
          className="w-full mt-2 rounded-2xl bg-zinc-900 text-white py-3 font-semibold disabled:opacity-40"
        >
          Satışı Tamamla
        </button>
      </div>
    </div>
  );
}
