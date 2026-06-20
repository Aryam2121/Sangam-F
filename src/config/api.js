const PRODUCTION_BACKEND = 'https://sangam-b.onrender.com';

const resolveBaseUrl = (value, fallback) => {
  const raw = (value || fallback || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) {
    return raw.replace(/\/$/, '');
  }
  return `http://${raw.replace(/\/$/, '')}`;
};

const inferApiBaseUrl = () => {
  const configured = import.meta.env.VITE_BACKEND?.trim();
  if (configured) return resolveBaseUrl(configured);

  if (typeof window !== 'undefined') {
    const { hostname, protocol } = window.location;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
    if (!isLocal && protocol.startsWith('http')) {
      return PRODUCTION_BACKEND;
    }
  }

  return resolveBaseUrl('', 'http://localhost:3002');
};

export const APP_API_BASE_URL = inferApiBaseUrl();
export const ML_API_BASE_URL = resolveBaseUrl(import.meta.env.VITE_BACKEND_ML, 'http://localhost:5000');

/** User-friendly message when fetch fails before reaching the server */
export const getNetworkErrorMessage = (error) => {
  if (error?.name === 'TypeError' || /failed to fetch|network error|load failed/i.test(error?.message || '')) {
    return `Cannot reach backend (${APP_API_BASE_URL}). Check VITE_BACKEND on Vercel and CORS_ORIGIN on the server.`;
  }
  return error?.message || 'Request failed';
};

/** JSON fetch with consistent network error handling */
export const fetchJson = async (path, options = {}) => {
  const { baseUrl = APP_API_BASE_URL, ...fetchOptions } = options;

  try {
    const response = await fetch(buildApiUrl(path, baseUrl), {
      credentials: 'include',
      ...fetchOptions,
    });
    const data = await response.json().catch(() => null);
    return { response, data };
  } catch (error) {
    throw new Error(getNetworkErrorMessage(error));
  }
};

/** Session auth uses httpOnly cookies; no Authorization header required. */
export const getAuthHeaders = () => ({});

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
    retryOnUnauthorized = true,
    ...fetchOptions
  } = options;

  const isFormData =
    typeof FormData !== 'undefined' && fetchOptions.body instanceof FormData;

  const execute = async () => {
    const headers = {
      ...(parseJson && !isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...(auth ? getAuthHeaders() : {}),
      ...(fetchOptions.headers || {}),
    };

    return fetch(buildApiUrl(path, baseUrl), {
      credentials: 'include',
      ...fetchOptions,
      headers,
    });
  };

  let response = await execute();

  if (auth && retryOnUnauthorized && response.status === 401) {
    try {
      await refreshAccessToken();
      response = await execute();
    } catch {
      /* fall through */
    }
  }

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

let refreshInFlight = null;

export const refreshAccessToken = async () => {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    const { response, data } = await fetchJson('/admin/refresh-token', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      throw new Error(data?.message || 'Session expired');
    }

    return true;
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
};

export default buildApiUrl;
