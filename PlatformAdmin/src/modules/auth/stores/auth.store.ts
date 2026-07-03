import { create } from "zustand";
import type { AuthUserDto } from "@/modules/auth/types/auth.types";

type AuthState = {
  user: AuthUserDto | null;
  isAuthenticated: boolean;
  setUser: (user: AuthUserDto | null) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: Boolean(user) }),
  logout: () => set({ user: null, isAuthenticated: false })
}));
