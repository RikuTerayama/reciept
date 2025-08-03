import { create } from 'zustand';
import { UserInfo } from '@/types';

interface AuthState {
  user: UserInfo | null;
  loading: boolean;
  setUser: (user: UserInfo | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
})); 
