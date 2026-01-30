"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { DemoUser } from "@/lib/auth";

type AuthUser = Omit<DemoUser, "password">;

type AuthState = {
  user: AuthUser | null;
  hydrated: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
  setHydrated: (hydrated: boolean) => void;
};

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      hydrated: false,
      login: (user) => set({ user }),
      logout: () => set({ user: null }),
      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: "esnaf-auth",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
