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
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border bg-white p-6 shadow-sm space-y-4">
        <div>
          <div className="text-lg font-semibold">Esnaf Web</div>
          <div className="text-sm text-zinc-500">Giriş yapın</div>
        </div>

        <div className="space-y-2">
          <input
            className="w-full rounded-lg border px-3 py-2 text-sm"
            placeholder="Kullanıcı adı"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
          <input
            className="w-full rounded-lg border px-3 py-2 text-sm"
            placeholder="Şifre"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        {error && <div className="rounded-lg bg-red-50 text-red-600 text-xs px-3 py-2">{error}</div>}

        <button
          type="button"
          onClick={handleLogin}
          className="w-full rounded-xl bg-zinc-900 text-white py-2 font-semibold"
        >
          Giriş Yap
        </button>

        <div className="rounded-xl border bg-zinc-50 p-3 text-xs text-zinc-600">
          <div className="font-medium text-zinc-700 mb-2">Demo hesaplar</div>
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
