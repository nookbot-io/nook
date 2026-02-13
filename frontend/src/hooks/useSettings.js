import { useState, useCallback } from 'react';
import { apiGet, apiPut } from '../api';

export function useSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet('/settings');
      setSettings(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveSettings = useCallback(async (updates) => {
    setSaving(true);
    setError(null);
    try {
      const data = await apiPut('/settings', updates);
      setSettings(data);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setSaving(false);
    }
  }, []);

  return { settings, loading, saving, error, loadSettings, saveSettings };
}
