import axios from 'axios';

const TOKEN_STORAGE_KEY = 'studySparkAI.tokens';

export function getStoredTokens() {
  try {
    const stored = sessionStorage.getItem(TOKEN_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    return null;
  }
}

export function storeTokens(tokens) {
  if (tokens?.accessToken && tokens?.refreshToken) sessionStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
  else sessionStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function hasStoredRefreshToken() {
  return Boolean(getStoredTokens()?.refreshToken);
}

export function getApiErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const data = error?.response?.data;
  if (data?.details?.length) return data.details.map((item) => item.msg || item.message).filter(Boolean).join(' ');
  return data?.message || error?.message || fallback;
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4009/api',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const tokens = getStoredTokens();
  if (tokens?.accessToken) config.headers.Authorization = `Bearer ${tokens.accessToken}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const isRefreshRequest = original.url?.includes('/auth/refresh');
    const isLogoutRequest = original.url?.includes('/auth/logout');
    if (error.response?.status === 401 && !original._retry && !isRefreshRequest && !isLogoutRequest) {
      original._retry = true;
      const tokens = getStoredTokens();
      if (!tokens?.refreshToken) {
        storeTokens(null);
        return Promise.reject(error);
      }
      try {
        const refreshResponse = await api.post('/auth/refresh', { refreshToken: tokens.refreshToken });
        storeTokens({ accessToken: refreshResponse.data.accessToken, refreshToken: refreshResponse.data.refreshToken });
        return api(original);
      } catch (refreshError) {
        storeTokens(null);
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
