import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost } from '../api';

export function useAuth() {
  const [state, setState] = useState({
    loading: true,
    authenticated: false,
    setupRequired: false,
  });

  const checkAuth = useCallback(async () => {
    try {
      const data = await apiGet('/auth/status');
      setState({
        loading: false,
        authenticated: data.authenticated,
        setupRequired: data.setupRequired,
      });
    } catch {
      setState({ loading: false, authenticated: false, setupRequired: true });
    }
  }, []);

  useEffect(() => {
    checkAuth();

    const handler = () => {
      setState((s) => ({ ...s, authenticated: false }));
    };
    window.addEventListener('nook:unauthorized', handler);
    return () => window.removeEventListener('nook:unauthorized', handler);
  }, [checkAuth]);

  const login = useCallback(async (password) => {
    const data = await apiPost('/auth/login', { password });
    if (data.success) {
      setState((s) => ({ ...s, authenticated: true }));
      return { success: true };
    }
    return { success: false, error: data.error };
  }, []);

  const logout = useCallback(async () => {
    await apiPost('/auth/logout');
    setState((s) => ({ ...s, authenticated: false }));
  }, []);

  return { ...state, login, logout, checkAuth };
}
