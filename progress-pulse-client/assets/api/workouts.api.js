// assets/api/workouts.api.js
import { API_URL } from '../api/client';

/** עטיפת fetch */
async function request(path, { method = 'GET', token, body } = {}) {
  if (!token) {
    const err = new Error('Missing token');
    err.status = 401;
    throw err;
  }
  const url = `${API_URL}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
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

/** ===== Sessions ===== */

// GET /api/workouts/sessions/today -> null | { _id, status, planned[], exercises[] ... }
export function getTodaySession({ token }) {
  return request('/api/workouts/sessions/today', { token });
}

// POST /api/workouts/sessions  body: { fromPlanId, planDay }
export function createSessionFromPlan({ token, fromPlanId, planDay }) {
  return request('/api/workouts/sessions', {
    method: 'POST',
    token,
    body: { fromPlanId, planDay },
  });
}

// GET /api/workouts/sessions/:sessionId/view -> { session, maxByExercise }
export function getSessionView({ token, sessionId }) {
  return request(`/api/workouts/sessions/${sessionId}/view`, { token });
}

/** ===== Live tracking ===== */

// POST /api/workouts/sessions/:sessionId/exercises  body: { exerciseId }
export function addExerciseToSession({ token, sessionId, exerciseId }) {
  return request(`/api/workouts/sessions/${sessionId}/exercises`, {
    method: 'POST',
    token,
    body: { exerciseId },
  });
}

// DELETE /api/workouts/sessions/:sessionId/exercises/:exerciseId
export function removeExerciseFromSession({ token, sessionId, exerciseId }) {
  return request(`/api/workouts/sessions/${sessionId}/exercises/${exerciseId}`, {
    method: 'DELETE',
    token,
  });
}

// POST /api/workouts/sessions/:sid/exercises/:eid/sets  body: { reps, weight }
export function addSetToExercise({ token, sessionId, exerciseId, reps, weight }) {
  return request(`/api/workouts/sessions/${sessionId}/exercises/${exerciseId}/sets`, {
    method: 'POST',
    token,
    body: { reps, weight },
  });
}

// PUT /api/workouts/sessions/:sid/exercises/:eid/sets/:setNumber  body: { reps, weight }
export function updateSetInExercise({ token, sessionId, exerciseId, setNumber, reps, weight }) {
  return request(
    `/api/workouts/sessions/${sessionId}/exercises/${exerciseId}/sets/${setNumber}`,
    { method: 'PUT', token, body: { reps, weight } }
  );
}

// DELETE /api/workouts/sessions/:sid/exercises/:eid/sets/:setNumber
export function removeSetFromExercise({ token, sessionId, exerciseId, setNumber }) {
  return request(
    `/api/workouts/sessions/${sessionId}/exercises/${exerciseId}/sets/${setNumber}`,
    { method: 'DELETE', token }
  );
}

/** ===== Close / History ===== */

// POST /api/workouts/sessions/:sessionId/close
export function closeSession({ token, sessionId }) {
  return request(`/api/workouts/sessions/${sessionId}/close`, {
    method: 'POST',
    token,
  });
}

// GET /api/workouts/history?from=&to=&skip=&limit=
export function listMyHistory({ token, from, to, skip = 0, limit = 20 } = {}) {
  const qs = new URLSearchParams();
  if (from) qs.set('from', from);
  if (to) qs.set('to', to);
  if (skip) qs.set('skip', String(skip));
  if (limit) qs.set('limit', String(limit));
  const suffix = qs.toString() ? `?${qs}` : '';
  return request(`/api/workouts/history${suffix}`, { token });
}

// GET /api/workouts/history/:workoutId
export function getMyWorkoutById({ token, workoutId }) {
  return request(`/api/workouts/history/${workoutId}`, { token });
}
