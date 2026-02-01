import { DemoUser, Role } from "./types";

export type { DemoUser };

export async function getDemoUsers(businessId?: string | null): Promise<DemoUser[]> {
  const url = businessId ? `/api/users?businessId=${businessId}` : "/api/users";
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    return [];
  }
  const data = await response.json();
  return data.items ?? [];
}

export async function saveDemoUsers(users: DemoUser[]) {
  const response = await fetch("/api/users", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ users }),
  });
  if (!response.ok) {
    throw new Error("Kullanıcılar kaydedilemedi.");
  }
  const data = await response.json();
  return data.items as DemoUser[];
}

export async function authenticate(businessName: string, username: string, password: string) {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ businessName, username, password }),
  });
  if (!response.ok) {
    return null;
  }
  const data = await response.json();
  return data.user ?? null;
}

export function roleLabel(role: Role) {
  if (role === "YONETIM") return "Yönetim";
  if (role === "ADMİN") return "Admin";
  if (role === "MÜDÜR") return "Müdür";
  return "Personel";
}
