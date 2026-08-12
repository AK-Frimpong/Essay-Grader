import { describe, it, expect, beforeEach } from 'vitest';
import { getBaseApiUrl } from '../services/api';

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

describe('API Service Unit Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should resolve base API URL dynamically', () => {
    const url = getBaseApiUrl();
    expect(url).toContain(':8000/api/v1');
  });

  it('should prioritize custom_backend_host when set in localStorage', () => {
    localStorage.setItem('custom_backend_host', 'http://192.168.1.200:8000/api/v1');
    const url = getBaseApiUrl();
    expect(url).toBe('http://192.168.1.200:8000/api/v1');
  });
});
