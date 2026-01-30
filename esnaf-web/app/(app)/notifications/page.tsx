export default function NotificationsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Bildirimler</h1>
        <p className="text-sm text-zinc-500">Kritik stok, satış özeti ve ürün performans uyarıları.</p>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
        <div className="font-medium">Aktif Bildirimler</div>
        <div className="grid gap-2 text-sm">
          {[
            "Kritik stok uyarıları",
            "Gün sonu satış ve kâr özeti",
            "Uzun süredir satılmayan ürün uyarıları",
          ].map((label) => (
            <label key={label} className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="h-4 w-4" />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
        <div className="font-medium">Kullanıcıya Özel Ayarlar</div>
        <div className="text-sm text-zinc-500">
          Bildirim sıklığı, kanal (uygulama içi/e-posta) ve rol bazlı filtreler kullanıcı tarafından özelleştirilebilir.
        </div>
        <div className="grid gap-2 text-sm">
          {[
            "Sadece kritik uyarıları göster",
            "Haftalık özet e-postası gönder",
            "Kasiyer / personel bildirimlerini filtrele",
          ].map((label) => (
            <label key={label} className="flex items-center gap-2">
              <input type="checkbox" className="h-4 w-4" />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
