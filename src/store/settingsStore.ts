import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

interface SettingsState {
  theme: Theme;
  apiKey: string;
  
  // Actions
  setTheme: (theme: Theme) => void;
  setApiKey: (key: string) => void;
  toggleTheme: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      apiKey: '',
      
      setTheme: (theme) => {
        set({ theme });
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },
      
      toggleTheme: () => {
        const newTheme = get().theme === 'light' ? 'dark' : 'light';
        get().setTheme(newTheme);
      },
      
      setApiKey: (apiKey) => set({ apiKey }),
    }),
    {
      name: 'settings-storage',
      partialize: (state) => ({ theme: state.theme, apiKey: state.apiKey }),
      onRehydrateStorage: () => (state) => {
        // Apply theme on hydration
        if (state?.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    }
  )
);
