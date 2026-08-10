import { create } from 'zustand';
import { LicenseStatus, LANStatus } from '../types';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

interface AppState {
  theme: 'dark' | 'light';
  currentView: 'dashboard' | 'rubrics' | 'ingest' | 'review' | 'analytics';
  selectedEssayId: string | null;
  licenseStatus: LicenseStatus | null;
  lanStatus: LANStatus | null;
  isOfflineMode: boolean;
  isLicenseModalOpen: boolean;
  isQrModalOpen: boolean;
  isCreateRubricModalOpen: boolean;
  toasts: Toast[];

  // Actions
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
  setView: (view: 'dashboard' | 'rubrics' | 'ingest' | 'review' | 'analytics', essayId?: string | null) => void;
  setLicenseStatus: (status: LicenseStatus | null) => void;
  setLanStatus: (status: LANStatus | null) => void;
  toggleOfflineMode: () => void;
  setLicenseModalOpen: (open: boolean) => void;
  setQrModalOpen: (open: boolean) => void;
  setCreateRubricModalOpen: (open: boolean) => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const initialTheme = (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
if (typeof document !== 'undefined') {
  if (initialTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

export const useAppStore = create<AppState>((set) => ({
  theme: initialTheme,
  currentView: 'dashboard',
  selectedEssayId: null,
  licenseStatus: null,
  lanStatus: null,
  isOfflineMode: true, // Offline-first for Ghanaian classrooms
  isLicenseModalOpen: false,
  isQrModalOpen: false,
  isCreateRubricModalOpen: false,
  toasts: [],

  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ theme });
  },

  toggleTheme: () => set((state) => {
    const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return { theme: nextTheme };
  }),

  setView: (view, essayId = null) => set({ currentView: view, selectedEssayId: essayId }),
  setLicenseStatus: (status) => set({ licenseStatus: status }),
  setLanStatus: (status) => set({ lanStatus: status }),
  toggleOfflineMode: () => set((state) => ({ isOfflineMode: !state.isOfflineMode })),
  setLicenseModalOpen: (open) => set({ isLicenseModalOpen: open }),
  setQrModalOpen: (open) => set({ isQrModalOpen: open }),
  setCreateRubricModalOpen: (open) => set({ isCreateRubricModalOpen: open }),
  
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 4500);
  },
  
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
}));
