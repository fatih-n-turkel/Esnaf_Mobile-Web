import { Role } from "./types";

export type DemoUser = {
  id: string;
  username: string;
  password: string;
  name: string;
  role: Role;
  landingPath: string;
};

const defaultDemoUsers: DemoUser[] = [
  {
    id: "user-admin",
    username: "fatih",
    password: "fatih",
    name: "Fatih",
    role: "ADMİN",
    landingPath: "/admin",
  },
  {
    id: "user-manager",
    username: "mehmet",
    password: "mehmet",
    name: "Mehmet",
    role: "MÜDÜR",
    landingPath: "/manager",
  },
  {
    id: "user-personnel",
    username: "cenk",
    password: "cenk",
    name: "Cenk",
    role: "PERSONEL",
    landingPath: "/personnel",
  },
];

const storageKey = "esnaf-demo-users";

export function getDemoUsers(): DemoUser[] {
  if (typeof window === "undefined") {
    return defaultDemoUsers;
  }
  const stored = window.localStorage.getItem(storageKey);
  if (!stored) {
    window.localStorage.setItem(storageKey, JSON.stringify(defaultDemoUsers));
    return defaultDemoUsers;
  }
  try {
    const parsed = JSON.parse(stored) as DemoUser[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return defaultDemoUsers;
    }
    return parsed;
  } catch {
    return defaultDemoUsers;
  }
}

export function saveDemoUsers(users: DemoUser[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey, JSON.stringify(users));
}

export function authenticate(username: string, password: string) {
  const normalized = username.trim().toLowerCase();
  const pass = password.trim().toLowerCase();
  const user = getDemoUsers().find(
    (u) => u.username.toLowerCase() === normalized && u.password.toLowerCase() === pass
  );
  if (!user) return null;
  const { password: _password, ...safeUser } = user;
  return safeUser;
}

export function roleLabel(role: Role) {
  if (role === "ADMİN") return "Admin";
  if (role === "MÜDÜR") return "Müdür";
  return "Personel";
}
