// assets/lib/api.js
import { Platform } from 'react-native';   // <-- REQUIRED

const PC_LAN_IP = '192.168.137.1';         // for real device on Wi-Fi during dev

export const BASE_URL =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL)
    ? process.env.EXPO_PUBLIC_API_URL
    : Platform.select({
        web:     'http://localhost:5500',
        ios:     'http://localhost:5500',
        android: 'http://10.0.2.2:5500',
        default: `http://${PC_LAN_IP}:5500`,
      });

const norm = (p) => (p.startsWith('/') ? p : `/${p}`);

export async function api(path, options = {}) {
  const res = await fetch(`${BASE_URL}${norm(path)}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });

  const ct   = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json() : await res.text();

  if (!res.ok) {
    const msg = typeof data === 'object' && data ? data.message : data;
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return data;
}

// Optional helpers
export const post = (path, body) => api(path, { method: 'POST', body: JSON.stringify(body) });
export const get  = (path)       => api(path);
