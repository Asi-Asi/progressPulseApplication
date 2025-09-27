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

  // Read the raw text first so empty bodies won't crash JSON.parse
  const raw = await res.text();
  let data = null;
  if (raw && raw.length) {
    try {
      data = JSON.parse(raw);
    } catch (e) {
      // Not valid JSON – keep the raw text (optional)
      data = raw;
    }
  }

  if (!res.ok) {
    const err = new Error(
      (data && data.message) || `HTTP ${res.status}`
    );
    err.status = res.status;
    err.payload = typeof data === 'string' ? { raw: data } : data;
    err.url = url;
    throw err;
  }

  return data; // may be null for 204/empty-body responses
}

export { request };

/** ---------- PLAN ---------- */

// GET /api/plans/me  =>  { days: [ { dayNumber, items: [ { exerciseId, sets } ] } ] }
export function getMyPlan({ token }) {
  return request('/api/plans/me', { token });
}

// PUT /api/plans/me  body: { days }
export function saveMyPlan({ token, days, locked }) {
  return request('/api/plans/me', { method: 'PUT', token, body: { days, locked } });
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
