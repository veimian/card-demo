import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  
  // Actions
  initializeAuth: () => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (session: Session | null) => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set) => ({
      session: null,
      user: null,
      loading: true,

      initializeAuth: async () => {
        set({ loading: true });
        
        // Get initial session
        const { data: { session } } = await supabase.auth.getSession();
        set({ 
          session, 
          user: session?.user ?? null,
          loading: false 
        });

        // Listen for changes
        supabase.auth.onAuthStateChange((_event, session) => {
          set({ 
            session, 
            user: session?.user ?? null,
            loading: false 
          });
        });
      },

      signOut: async () => {
        await supabase.auth.signOut();
        set({ session: null, user: null });
      },

      setUser: (session) => {
        set({ 
          session, 
          user: session?.user ?? null 
        });
      }
    }),
    { name: 'auth-store' }
  )
);
