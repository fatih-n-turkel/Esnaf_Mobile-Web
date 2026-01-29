"use client";

export default function Topbar() {
  return (
    <header className="sticky top-0 z-10 bg-white border-b">
      <div className="flex items-center justify-between gap-2 p-3 md:p-4">
        <input
          className="w-full max-w-xl rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900"
          placeholder="Ürün ara (Ctrl+K) — demo"
        />
        <div className="text-xs text-zinc-500 whitespace-nowrap">
          Demo Kullanıcı: <span className="font-medium text-zinc-900">Müdür</span>
        </div>
      </div>
    </header>
  );
}
