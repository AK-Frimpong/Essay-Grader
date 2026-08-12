import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../store/useAppStore';

// Ensure in-memory localStorage mock for Node environment
if (typeof globalThis.localStorage === 'undefined') {
  const store: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, val: string) => { store[key] = val; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); }
  } as any;
}

describe('Zustand AppStore Unit Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    useAppStore.setState({
      theme: 'dark',
      currentView: 'dashboard',
      teacherPin: null,
      isTeacherAuthenticated: false,
      isPinModalOpen: false,
      toasts: []
    });
  });

  it('should switch application view', () => {
    const { setView } = useAppStore.getState();
    setView('rubrics', 'essay-123');

    const state = useAppStore.getState();
    expect(state.currentView).toBe('rubrics');
    expect(state.selectedEssayId).toBe('essay-123');
  });

  it('should handle theme toggling', () => {
    const { toggleTheme } = useAppStore.getState();
    toggleTheme();

    const state = useAppStore.getState();
    expect(state.theme).toBe('light');
    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('should handle teacher PIN authentication and logout', () => {
    const { setTeacherPin, logoutTeacher } = useAppStore.getState();

    setTeacherPin('1234');
    let state = useAppStore.getState();
    expect(state.teacherPin).toBe('1234');
    expect(state.isTeacherAuthenticated).toBe(true);
    expect(localStorage.getItem('teacher_pin')).toBe('1234');

    logoutTeacher();
    state = useAppStore.getState();
    expect(state.teacherPin).toBeNull();
    expect(state.isTeacherAuthenticated).toBe(false);
    expect(localStorage.getItem('teacher_pin')).toBeNull();
  });

  it('should add and remove toast notifications', () => {
    const { addToast, removeToast } = useAppStore.getState();

    addToast({ type: 'success', title: 'Test Toast', message: 'Hello Vitest' });
    let state = useAppStore.getState();
    expect(state.toasts.length).toBe(1);
    expect(state.toasts[0].title).toBe('Test Toast');

    const toastId = state.toasts[0].id;
    removeToast(toastId);
    state = useAppStore.getState();
    expect(state.toasts.length).toBe(0);
  });
});
