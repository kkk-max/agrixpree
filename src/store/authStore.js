import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      setAuth: (user, accessToken) => set({ user, accessToken, isAuthenticated: true }),
      logout: () => set({ user: null, accessToken: null, isAuthenticated: false }),
      updateToken: (accessToken) => set({ accessToken })
    }),
    {
      name: 'agrixpree-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated })
      // Token NOT persisted — stays in memory only
    }
  )
);

export default useAuthStore;
