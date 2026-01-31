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
  const items = [...baseItems];
  if (user?.role === "ADMİN" || user?.role === "MÜDÜR") {
    items.push({ href: "/analysis", label: "Analiz" });
  }
  if (user?.role === "ADMİN") {
    items.push({ href: "/admin", label: "Admin" });
  }
  if (user?.role === "MÜDÜR") {
    items.push({ href: "/manager", label: "Müdür" });
  }
  if (user?.role === "PERSONEL") {
    items.push({ href: "/personnel", label: "Personel" });
  }

  return (
    <aside className="w-64 hidden md:block border-r bg-white min-h-screen">
      <div className="px-4 py-4 border-b">
        <div className="text-lg font-semibold">Esnaf Web</div>
        <div className="text-xs text-zinc-500">Hızlı Satış + Stok</div>
      </div>

      <nav className="p-2">
        {items.map((it) => {
          const active = path === it.href;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={[
                "block px-3 py-2 rounded-lg text-sm",
                active ? "bg-zinc-900 text-white" : "hover:bg-zinc-100 text-zinc-800",
              ].join(" ")}
            >
              {it.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
