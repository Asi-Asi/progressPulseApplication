// assets/api/workouts.api.js
import { API_URL } from './client';

async function request(path, { method='GET', token, body } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  });
  const raw = await res.text();
  const data = raw ? (()=>{ try { return JSON.parse(raw); } catch { return raw; }})() : null;
  if (!res.ok) {
    const err = new Error((data && data.message) || `HTTP ${res.status}`);
    err.status = res.status; err.payload = typeof data === 'string' ? { raw:data } : data;
    throw err;
  }
  return data;
}

export const workoutsApi = {
  // 1) פתיחה/שליפה של סשן היום
  getTodaySession: ({ token }) =>
    request('/api/workouts/sessions/today', { token }),

  createSessionFromPlan: ({ token, fromPlanId, planDay }) =>
    request('/api/workouts/sessions', { method: 'POST', token, body: { fromPlanId, planDay } }),

  // 2) תצוגת סשן (כולל maxByExercise)
  getSessionView: ({ token, sessionId }) =>
    request(`/api/workouts/sessions/${sessionId}/view`, { token }),

  // 3) לייב אוטוסייב
  addExercise: ({ token, sessionId, exerciseId }) =>
    request(`/api/workouts/sessions/${sessionId}/exercises`, { method:'POST', token, body:{ exerciseId } }),

  removeExercise: ({ token, sessionId, exerciseId }) =>
    request(`/api/workouts/sessions/${sessionId}/exercises/${exerciseId}`, { method:'DELETE', token }),

  addSet: ({ token, sessionId, exerciseId, reps, weight }) =>
    request(`/api/workouts/sessions/${sessionId}/exercises/${exerciseId}/sets`, { method:'POST', token, body:{ reps, weight } }),

  updateSet: ({ token, sessionId, exerciseId, setNumber, reps, weight }) =>
    request(`/api/workouts/sessions/${sessionId}/exercises/${exerciseId}/sets/${setNumber}`, { method:'PUT', token, body:{ reps, weight } }),

  removeSet: ({ token, sessionId, exerciseId, setNumber }) =>
    request(`/api/workouts/sessions/${sessionId}/exercises/${exerciseId}/sets/${setNumber}`, { method:'DELETE', token }),

  // 4) סגירת הסשן
  closeSession: ({ token, sessionId }) =>
    request(`/api/workouts/sessions/${sessionId}/close`, { method:'POST', token }),
};
  