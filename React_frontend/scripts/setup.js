import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import { logout } from '../src/store/slices/authSlice.js';
import { store } from '../src/store/store.js';

afterEach(() => {
  cleanup();
  store.dispatch(logout());
  sessionStorage.clear();
  localStorage.clear();
  vi.unstubAllGlobals();
});
