const API_BASE_URL = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');
const TOKEN_KEY = 'websale-token';
const USER_KEY = 'websale-user';
const SESSION_KEY = 'websale-cart-session';

export function getCartSessionId() {
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = window.crypto?.randomUUID
      ? window.crypto.randomUUID()
      : `websale-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
  } catch {
    return null;
  }
}

export function storeAuth({ token, user }) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function errorMessage(data, status) {
  if (typeof data === 'string' && data.trim()) return data;
  if (data?.detail) return data.detail;
  if (data?.message) return data.message;
  if (data && typeof data === 'object') {
    const firstError = Object.values(data).flat(Infinity).find((value) => typeof value === 'string');
    if (firstError) return firstError;
  }
  return `Request failed (${status}).`;
}

export async function api(path, options = {}) {
  const headers = { Accept: 'application/json', ...options.headers };
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  if (!response.ok) throw new Error(errorMessage(data, response.status));
  return data;
}

export function jsonBody(value) {
  return JSON.stringify(value);
}

export function unwrapList(data) {
  return Array.isArray(data) ? data : data?.results || [];
}
