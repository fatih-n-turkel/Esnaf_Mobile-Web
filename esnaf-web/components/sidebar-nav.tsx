"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/store/auth";

const baseItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/sales/quick", label: "Hızlı Satış" },
  { href: "/products", label: "Ürünler" },
  { href: "/stock", label: "Stok" },
  { href: "/notifications", label: "Bildirimler" },
  { href: "/settings", label: "Ayarlar" },
];

export default function SidebarNav() {
  const path = usePathname();
  const user = useAuth((state) => state.user);
  const items =
    user?.role === "YONETIM"
      ? []
      : baseItems.filter((item) => !(user?.role === "PERSONEL" && item.href === "/dashboard"));
  if (user?.role === "ADMİN" || user?.role === "MÜDÜR") {
    items.push({ href: "/analysis", label: "Analiz" });
  }
  if (user?.role === "ADMİN" || user?.role === "YONETIM") {
    items.push({ href: "/admin", label: "Admin" });
  }
  if (user?.role === "MÜDÜR") {
    items.push({ href: "/manager", label: "Müdür" });
  }
  return (
    <aside className="w-72 hidden md:flex min-h-screen flex-col border-r border-slate-200/70 bg-white/80 backdrop-blur-xl">
      <div className="px-5 py-5 border-b border-slate-200/70">
        <div className="text-lg font-semibold tracking-tight text-slate-900">
          {user?.role === "YONETIM"
            ? "Esnaf Mobile Web - Admin"
            : `Esnaf Mobile Web - ${user?.businessName ?? "İşletme"}`}
        </div>
        <div className="text-xs text-slate-500">Hızlı Satış + Stok</div>
      </div>

      <nav className="flex-1 p-3">
        <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400 px-3 mb-2">Menü</div>
        {items.map((it) => {
          const active = path === it.href;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={[
                "group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition",
                active
                  ? "bg-slate-900 text-white shadow-md shadow-slate-900/15"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
              ].join(" ")}
            >
              <span>{it.label}</span>
              <span
                className={[
                  "h-1.5 w-1.5 rounded-full transition",
                  active ? "bg-white" : "bg-slate-300 group-hover:bg-slate-400",
                ].join(" ")}
              />
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
