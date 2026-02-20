import { useAuthStore } from '../store/authStore';

// Re-export useAuth from store for backward compatibility
export const useAuth = () => {
  const session = useAuthStore((state) => state.session);
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const signOut = useAuthStore((state) => state.signOut);

  return { session, user, loading, signOut };
};

// Deprecated Provider (kept if some imports still use it, though we removed it from main.tsx)
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // This is now a no-op wrapper since state is in Zustand
  return <>{children}</>;
}
