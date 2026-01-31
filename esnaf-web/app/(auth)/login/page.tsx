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

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [demoList, setDemoList] = useState<DemoUser[]>([]);

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
      router.replace("/dashboard");
    }
  }, [router, user]);

  if (user) {
    return null;
  }

  async function handleLogin() {
    const authUser = await authenticate(username, password);
    if (!authUser) {
      setError("Kullanıcı adı veya şifre hatalı.");
      return;
    }
    login(authUser);
    router.replace(authUser.landingPath || "/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4">
      <div className="w-full max-w-sm rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-xl shadow-slate-900/5 space-y-5">
        <div>
          <div className="text-lg font-semibold text-slate-900">Esnaf Web</div>
          <div className="text-sm text-slate-500">Giriş yapın</div>
        </div>

        <div className="space-y-3">
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

        <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-3 text-xs text-slate-600">
          <div className="font-medium text-slate-700 mb-2">Demo hesaplar</div>
          <ul className="space-y-1">
            {demoList.map((demo) => (
                <li key={demo.id}>
                  <span className="font-medium">{demo.name}</span> — {demo.username} / {demo.password}
                </li>
              ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
