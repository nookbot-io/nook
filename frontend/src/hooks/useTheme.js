import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'nook-theme';

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function applyTheme(resolved) {
  document.documentElement.classList.remove('light', 'dark');
  if (resolved === 'light') {
    document.documentElement.classList.add('light');
  }
}

export function useTheme() {
  const [preference, setPreference] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || 'dark';
  });

  const resolved = preference === 'system' ? getSystemTheme() : preference;

  useEffect(() => {
    applyTheme(resolved);
  }, [resolved]);

  // Listen for system theme changes when preference is "system"
  useEffect(() => {
    if (preference !== 'system') return;

    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const handler = () => applyTheme(getSystemTheme());
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [preference]);

  const setTheme = useCallback((theme) => {
    setPreference(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, []);

  return { theme: preference, resolved, setTheme };
}
