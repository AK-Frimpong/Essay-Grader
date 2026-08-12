import { create } from 'zustand';
import { LicenseStatus, LANStatus } from '../types';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

export type ThemeMode = 'dark' | 'light' | 'high-contrast';

export interface TeacherProfile {
  id: string;
  name: string;
  email: string;
  school: string;
  subject: string;
  staff_id?: string;
}

interface AppState {
  theme: ThemeMode;
  currentView: 'landing' | 'dashboard' | 'rubrics' | 'ingest' | 'review' | 'analytics';
  selectedEssayId: string | null;
  licenseStatus: LicenseStatus | null;
  lanStatus: LANStatus | null;
  isOfflineMode: boolean;
  isLicenseModalOpen: boolean;
  isQrModalOpen: boolean;
  isCreateRubricModalOpen: boolean;
  isRightSidebarOpen: boolean;
  activeSidebarTab: 'chat' | 'nav';
  
  // Teacher Authentication & Security Profile
  teacherPin: string | null;
  isTeacherAuthenticated: boolean;
  isPinModalOpen: boolean;
  pinModalMode: 'verify' | 'change';
  
  currentTeacher: TeacherProfile | null;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'signup';
  
  toasts: Toast[];

  // Actions
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setView: (view: 'landing' | 'dashboard' | 'rubrics' | 'ingest' | 'review' | 'analytics', essayId?: string | null) => void;
  setLicenseStatus: (status: LicenseStatus | null) => void;
  setLanStatus: (status: LANStatus | null) => void;
  toggleOfflineMode: () => void;
  setLicenseModalOpen: (open: boolean) => void;
  setQrModalOpen: (open: boolean) => void;
  setCreateRubricModalOpen: (open: boolean) => void;
  setRightSidebarOpen: (open: boolean, tab?: 'chat' | 'nav') => void;
  setActiveSidebarTab: (tab: 'chat' | 'nav') => void;

  // Teacher Auth Actions
  setTeacherPin: (pin: string | null) => void;
  setPinModalOpen: (open: boolean, mode?: 'verify' | 'change') => void;
  setAuthModalOpen: (open: boolean, mode?: 'login' | 'signup') => void;
  setCurrentTeacher: (teacher: TeacherProfile | null) => void;
  logoutTeacher: () => void;

  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const applyThemeClasses = (t: ThemeMode) => {
  if (typeof document === 'undefined') return;
  const el = document.documentElement;
  el.classList.remove('dark', 'light', 'high-contrast');
  if (t === 'dark') {
    el.classList.add('dark');
  } else if (t === 'high-contrast') {
    el.classList.add('dark', 'high-contrast');
  } else {
    el.classList.add('light');
  }
};

const initialTheme = typeof localStorage !== 'undefined' ? (localStorage.getItem('theme') as ThemeMode) || 'dark' : 'dark';
applyThemeClasses(initialTheme);

const savedPin = typeof localStorage !== 'undefined' ? localStorage.getItem('teacher_pin') : null;
const savedTeacher = typeof localStorage !== 'undefined' ? localStorage.getItem('current_teacher') : null;
const parsedTeacher = savedTeacher ? JSON.parse(savedTeacher) : {
  id: 'tch-001',
  name: 'Mr. Kofi Mensah',
  email: 'kofi.mensah@achimotajhs.edu.gh',
  school: 'Achimota Basic School / JHS',
  subject: 'English Language',
  staff_id: 'GES-2026-9812'
};

export const useAppStore = create<AppState>((set) => ({
  theme: initialTheme,
  currentView: 'dashboard',
  selectedEssayId: null,
  licenseStatus: null,
  lanStatus: null,
  isOfflineMode: true,
  isLicenseModalOpen: false,
  isQrModalOpen: false,
  isCreateRubricModalOpen: false,
  isRightSidebarOpen: false,
  activeSidebarTab: 'nav',

  teacherPin: savedPin,
  isTeacherAuthenticated: true,
  isPinModalOpen: false,
  pinModalMode: 'verify',

  currentTeacher: parsedTeacher,
  isAuthModalOpen: false,
  authModalMode: 'login',

  toasts: [],

  setTheme: (theme) => {
    if (typeof localStorage !== 'undefined') localStorage.setItem('theme', theme);
    applyThemeClasses(theme);
    set({ theme });
  },

  toggleTheme: () => set((state) => {
    const nextTheme: ThemeMode = state.theme === 'dark' ? 'light' : state.theme === 'light' ? 'high-contrast' : 'dark';
    if (typeof localStorage !== 'undefined') localStorage.setItem('theme', nextTheme);
    applyThemeClasses(nextTheme);
    return { theme: nextTheme };
  }),

  setView: (view, essayId = null) => set({ currentView: view, selectedEssayId: essayId }),

  setLicenseStatus: (status) => set({ licenseStatus: status }),
  setLanStatus: (status) => set({ lanStatus: status }),
  toggleOfflineMode: () => set((state) => ({ isOfflineMode: !state.isOfflineMode })),

  setLicenseModalOpen: (open) => set({ isLicenseModalOpen: open }),
  setQrModalOpen: (open) => set({ isQrModalOpen: open }),
  setCreateRubricModalOpen: (open) => set({ isCreateRubricModalOpen: open }),
  setRightSidebarOpen: (open, tab = 'nav') => set({ isRightSidebarOpen: open, activeSidebarTab: tab }),
  setActiveSidebarTab: (tab) => set({ activeSidebarTab: tab }),

  setTeacherPin: (pin) => {
    if (typeof localStorage !== 'undefined') {
      if (pin) localStorage.setItem('teacher_pin', pin);
      else localStorage.removeItem('teacher_pin');
    }
    set({ teacherPin: pin, isTeacherAuthenticated: !!pin });
  },

  setPinModalOpen: (open, mode = 'verify') => set({ isPinModalOpen: open, pinModalMode: mode }),
  
  setAuthModalOpen: (open, mode = 'login') => set({ isAuthModalOpen: open, authModalMode: mode }),

  setCurrentTeacher: (teacher) => {
    if (typeof localStorage !== 'undefined') {
      if (teacher) localStorage.setItem('current_teacher', JSON.stringify(teacher));
      else localStorage.removeItem('current_teacher');
    }
    set({ currentTeacher: teacher, isTeacherAuthenticated: !!teacher });
  },

  logoutTeacher: () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('current_teacher');
    }
    set({ currentTeacher: null, isTeacherAuthenticated: false, currentView: 'landing' });
  },

  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }]
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id)
      }));
    }, 5000);
  },

  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id)
  })),
}));
