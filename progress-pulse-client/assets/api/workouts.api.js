// assets/api/workouts.api.js
import { API_URL } from "./client";

const parse = async (res) => {
  const txt = await res.text();
  const data = txt ? (() => { try { return JSON.parse(txt); } catch { return txt; } })() : null;
  if (!res.ok) {
    const err = new Error((data && data.message) || `HTTP ${res.status}`);
    err.status = res.status;
    err.payload = typeof data === "string" ? { raw: data } : data;
    throw err;
  }
  return data;
};

export function getTodaySession({ token }) {
  return fetch(`${API_URL}/api/workouts/sessions/today`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then(parse);
}
export function createSession({ token, fromPlanId, planDay }) {
  return fetch(`${API_URL}/api/workouts/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ fromPlanId, planDay }),
  }).then(parse);
}
export function getSessionView({ token, sessionId }) {
  return fetch(`${API_URL}/api/workouts/sessions/${sessionId}/view`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then(parse);
}
export function addExercise({ token, sessionId, exerciseId }) {
  return fetch(`${API_URL}/api/workouts/sessions/${sessionId}/exercises`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ exerciseId }),
  }).then(parse);
}
export function removeExercise({ token, sessionId, exerciseId }) {
  return fetch(`${API_URL}/api/workouts/sessions/${sessionId}/exercises/${exerciseId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  }).then(parse);
}
export function addSet({ token, sessionId, exerciseId, reps, weight }) {
  return fetch(`${API_URL}/api/workouts/sessions/${sessionId}/exercises/${exerciseId}/sets`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ reps, weight }),
  }).then(parse);
}
export function updateSet({ token, sessionId, exerciseId, setNumber, reps, weight }) {
  return fetch(`${API_URL}/api/workouts/sessions/${sessionId}/exercises/${exerciseId}/sets/${setNumber}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ reps, weight }),
  }).then(parse);
}
export function removeSet({ token, sessionId, exerciseId, setNumber }) {
  return fetch(`${API_URL}/api/workouts/sessions/${sessionId}/exercises/${exerciseId}/sets/${setNumber}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  }).then(parse);
}

export async function discardSession({ token, sessionId }) {
  return request(`/api/workouts/session/${sessionId}/discard`, {
    method: "POST",
    token,
  });
}


export function closeSession({ token, sessionId }) {
  return fetch(`${API_URL}/api/workouts/sessions/${sessionId}/close`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  }).then(parse);
}
