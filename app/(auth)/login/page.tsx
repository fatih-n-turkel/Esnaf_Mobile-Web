export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="w-full max-w-sm rounded-2xl border bg-white p-6 shadow-sm">
        <div className="text-lg font-semibold">Esnaf Web</div>
        <div className="text-sm text-zinc-500 mb-4">Demo giriş ekranı</div>

        <input className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="E-posta / Telefon" />
        <input className="w-full rounded-lg border px-3 py-2 text-sm mt-2" placeholder="Şifre" type="password" />
        <a className="text-xs text-zinc-500 mt-2 inline-block" href="#">
          Şifremi unuttum
        </a>

        <a href="/dashboard" className="block text-center rounded-xl bg-zinc-900 text-white py-2 mt-4 font-semibold">
          Giriş (Demo)
        </a>
      </div>
    </div>
  );
}
