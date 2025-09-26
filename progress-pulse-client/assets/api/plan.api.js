// assets/api/plan.api.js
import { API_URL } from './client';

/** עטיפת fetch כמו בלוגין */
async function request(path, { method = 'GET', token, body } = {}) {
  const url = `${API_URL}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  });

  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json() : null;

  if (!res.ok) {
    const err = new Error(data?.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.payload = data;
    err.url = url;
    throw err;
  }
  return data;
}

/** ---------- PLAN ---------- */

// GET /api/plans/me  =>  { days: [ { dayNumber, items: [ { exerciseId, sets } ] } ] }
export function getMyPlan({ token }) {
  return request('/api/plans/me', { token });
}

// PUT /api/plans/me  body: { days }
export function saveMyPlan({ token, days }) {
  return request('/api/plans/me', { method: 'PUT', token, body: { days } });
}

// DELETE /api/plans/me
export function clearMyPlan({ token }) {
  return request('/api/plans/me', { method: 'DELETE', token });
}

/** ---------- EXERCISES ---------- */

// GET /api/exercises?muscle=&query=&limit=&skip=
export function listExercises({ token, muscle, query, limit = 40, skip = 0 } = {}) {
  const qs = new URLSearchParams();
  if (muscle) qs.set('muscle', muscle);
  if (query)  qs.set('query', query);
  if (limit)  qs.set('limit', String(limit));
  if (skip)   qs.set('skip', String(skip));
  const suffix = qs.toString() ? `?${qs}` : '';
  return request(`/api/exercises${suffix}`, { token });
}

// אופציונלי: GET /api/exercises/:id (למיפוי ID→שם/שריר)
export function getExercise({ token, id }) {
  return request(`/api/exercises/${id}`, { token });
}
