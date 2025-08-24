import { Platform } from 'react-native';

const LOCAL_BASE = Platform.select({
  ios:     'http://localhost:5500',
  android: 'http://10.0.2.2:5500',
  default: 'http://192.168.0.100:5500', // אם בודקים ממכשיר על אותה רשת
});

export const BASE_URL = __DEV__
  ? LOCAL_BASE
  : 'https://progresspulseapplication.onrender.com';

export async function api(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json().catch(() => ({}));
}
