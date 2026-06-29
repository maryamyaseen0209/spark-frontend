import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/client.js';

export function useDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async (retries = 2) => {
    setLoading(true);
    setError(null);
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const res = await apiClient.get('/dashboard');
        if (res.success && res.dashboard) {
          setData(res.dashboard);
          setLoading(false);
          return;
        }
      } catch (err) {
        if (attempt === retries) {
          const message = err?.response?.data?.message || err.message || 'Failed to load dashboard data.';
          setError(message);
          setLoading(false);
        } else {
          await new Promise((r) => setTimeout(r, 1000 * attempt));
        }
      }
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return { data, loading, error, refetch: () => fetchDashboard() };
}