import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Profile } from "../types";

interface AuthState {
  user: Profile | null;
  isLoading: boolean;
  setUser: (user: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,

      setUser: (user) => set({ user }),

      setLoading: (loading) => set({ isLoading: loading }),

      logout: () => set({ user: null }),
    }),
    {
      name: "catalogo-auth",
    },
  ),
);
