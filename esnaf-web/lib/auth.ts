import { Role } from "./types";

export type DemoUser = {
  id: string;
  username: string;
  password: string;
  name: string;
  role: Role;
  landingPath: string;
};

export const demoUsers: DemoUser[] = [
  {
    id: "user-admin",
    username: "admin",
    password: "admin",
    name: "Admin",
    role: "ADMİN",
    landingPath: "/admin",
  },
  {
    id: "user-manager",
    username: "müdür",
    password: "müdür",
    name: "Müdür",
    role: "MÜDÜR",
    landingPath: "/manager",
  },
  {
    id: "user-manager-ascii",
    username: "mudur",
    password: "mudur",
    name: "Müdür",
    role: "MÜDÜR",
    landingPath: "/manager",
  },
  {
    id: "user-personnel",
    username: "personel",
    password: "personel",
    name: "Personel",
    role: "PERSONEL",
    landingPath: "/personnel",
  },
];

export function authenticate(username: string, password: string) {
  const normalized = username.trim().toLowerCase();
  const pass = password.trim().toLowerCase();
  const user = demoUsers.find(
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
