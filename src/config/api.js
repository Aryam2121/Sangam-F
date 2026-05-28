const resolveBaseUrl = (value, fallback) => {
  const raw = (value || fallback || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) {
    return raw.replace(/\/$/, '');
  }
  return `http://${raw.replace(/\/$/, '')}`;
};

export const APP_API_BASE_URL = resolveBaseUrl(import.meta.env.VITE_BACKEND, 'http://localhost:3002');
export const ML_API_BASE_URL = resolveBaseUrl(import.meta.env.VITE_BACKEND_ML, 'http://localhost:5000');

export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const buildApiUrl = (path = '', baseUrl = APP_API_BASE_URL) => {
  if (!baseUrl) {
    return path.startsWith('/') ? path : `/${path}`;
  }

  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

/**
 * Authenticated JSON fetch with consistent error handling.
 */
export const apiFetch = async (path, options = {}) => {
  const {
    baseUrl = APP_API_BASE_URL,
    auth = true,
    parseJson = true,
    ...fetchOptions
  } = options;

  const headers = {
    ...(parseJson ? { 'Content-Type': 'application/json' } : {}),
    ...(auth ? getAuthHeaders() : {}),
    ...(fetchOptions.headers || {}),
  };

  const response = await fetch(buildApiUrl(path, baseUrl), {
    credentials: 'include',
    ...fetchOptions,
    headers,
  });

  if (!parseJson) {
    if (!response.ok) {
      throw new Error(`Request failed (${response.status})`);
    }
    return response;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      (Array.isArray(data?.errors) ? data.errors.join(', ') : null) ||
      `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data;
};

/** Unwrap ApiResponse-style payloads: { data: T } or raw T */
export const unwrapApiData = (payload) => {
  if (payload && typeof payload === 'object' && 'data' in payload && payload.data !== undefined) {
    return payload.data;
  }
  return payload;
};

export default buildApiUrl;
