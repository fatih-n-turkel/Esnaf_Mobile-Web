"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authenticate, getDemoUsers } from "@/lib/auth";
import { DemoUser } from "@/lib/types";
import { useAuth } from "@/store/auth";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuth((state) => state.login);
  const user = useAuth((state) => state.user);

  const [businessName, setBusinessName] = useState("Şen Bakkal");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [demoList, setDemoList] = useState<DemoUser[]>([]);
  const [showApply, setShowApply] = useState(false);
  const [applyForm, setApplyForm] = useState({
    businessName: "",
    username: "",
    password: "",
  });
  const [applyMessage, setApplyMessage] = useState("");

  useEffect(() => {
    let active = true;
    getDemoUsers().then((list) => {
      if (active) setDemoList(list);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (user) {
      router.replace(user.landingPath || "/dashboard");
    }
  }, [router, user]);

  if (user) {
    return null;
  }

  async function handleLogin() {
    const authUser = await authenticate(businessName, username, password);
    if (!authUser) {
      setError("Kullanıcı adı veya şifre hatalı.");
      return;
    }
    login(authUser);
    router.replace(authUser.landingPath || "/dashboard");
  }

  async function handleApply() {
    if (!applyForm.businessName.trim() || !applyForm.username.trim() || !applyForm.password.trim()) {
      setApplyMessage("Lütfen tüm alanları doldurun.");
      return;
    }
    const response = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(applyForm),
    });
    if (!response.ok) {
      setApplyMessage("Başvuru gönderilemedi. Lütfen tekrar deneyin.");
      return;
    }
    setApplyMessage("İstek gönderildi, en kısa sürede işleme alınacaktır.");
    setApplyForm({ businessName: "", username: "", password: "" });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4">
      <div className="w-full max-w-sm rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-xl shadow-slate-900/5 space-y-5">
        <div>
          <div className="text-lg font-semibold text-slate-900">Esnaf Mobile Web</div>
          <div className="text-sm text-slate-500">Giriş yapın</div>
        </div>

        <div className="space-y-3">
          <input
            className="w-full rounded-2xl border border-slate-200/70 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10"
            placeholder="İşletme adı"
            value={businessName}
            onChange={(event) => setBusinessName(event.target.value)}
          />
          <input
            className="w-full rounded-2xl border border-slate-200/70 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10"
            placeholder="Kullanıcı adı"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
          <input
            className="w-full rounded-2xl border border-slate-200/70 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10"
            placeholder="Şifre"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        {error && (
          <div className="rounded-2xl bg-rose-50 text-rose-600 text-xs px-3 py-2">{error}</div>
        )}

        <button
          type="button"
          onClick={handleLogin}
          className="w-full rounded-2xl bg-slate-900 text-white py-2.5 font-semibold shadow-lg shadow-slate-900/20 transition hover:bg-slate-800"
        >
          Giriş Yap
        </button>

        <div className="rounded-2xl border border-dashed border-slate-200/70 bg-slate-50/70 p-3 text-xs text-slate-600 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-medium text-slate-700">Başvur</div>
            <button
              type="button"
              onClick={() => {
                setShowApply((prev) => !prev);
                setApplyMessage("");
              }}
              className="text-xs font-medium text-slate-700 hover:text-slate-900"
            >
              {showApply ? "Kapat" : "Formu Aç"}
            </button>
          </div>
          {showApply && (
            <div className="space-y-2">
              <input
                className="w-full rounded-2xl border border-slate-200/70 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10"
                placeholder="İşletme adı"
                value={applyForm.businessName}
                onChange={(event) => setApplyForm({ ...applyForm, businessName: event.target.value })}
              />
              <input
                className="w-full rounded-2xl border border-slate-200/70 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10"
                placeholder="Kullanıcı adı"
                value={applyForm.username}
                onChange={(event) => setApplyForm({ ...applyForm, username: event.target.value })}
              />
              <input
                className="w-full rounded-2xl border border-slate-200/70 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10"
                placeholder="Şifre"
                type="password"
                value={applyForm.password}
                onChange={(event) => setApplyForm({ ...applyForm, password: event.target.value })}
              />
              <button
                type="button"
                onClick={handleApply}
                className="w-full rounded-2xl bg-slate-800 text-white py-2 text-xs font-semibold"
              >
                Başvuruyu Gönder
              </button>
              {applyMessage && (
                <div className="rounded-xl bg-white px-3 py-2 text-[11px] text-slate-600">{applyMessage}</div>
              )}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-3 text-xs text-slate-600">
          <div className="font-medium text-slate-700 mb-2">Demo hesaplar</div>
          <ul className="space-y-1">
            {demoList.map((demo) => (
              <li key={demo.id}>
                <span className="font-medium">{demo.name}</span> — {demo.username} / {demo.password} •{" "}
                {demo.role === "YONETIM" ? "Yönetim" : demo.businessName ?? "Şen Bakkal"}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
