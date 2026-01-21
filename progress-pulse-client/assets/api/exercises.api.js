// assets/api/exercises.api.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "./client"; // you already have this in your project

async function request(path, { method = "GET", body } = {}) {
  const token = await AsyncStorage.getItem("accessToken");
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // no body
  }

  if (!res.ok) {
    const msg = data?.message || `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

/* List exercises (read-only; auth required by your router) */
export async function listExercisesAPI({ muscle, query, limit = 50, skip = 0 } = {}) {
  const params = new URLSearchParams();
  if (muscle) params.append("muscle", muscle);
  if (query) params.append("query", query);
  if (limit != null) params.append("limit", String(limit));
  if (skip != null) params.append("skip", String(skip));
  const qs = params.toString() ? `?${params.toString()}` : "";
  // Server returns an array
  const data = await request(`/api/exercises${qs}`);
  return Array.isArray(data) ? data : [];
}

/* Create exercise (admin only) */
export async function createExerciseAPI(payload) {
  // payload: { name, muscle, type, equipment }
  // server accepts muscle as slug ("abs") or label ("Abs"); we'll send label for clarity.
  return await request(`/api/exercises`, { method: "POST", body: payload });
}

/* Delete exercise (admin only) */
export async function deleteExerciseAPI(id) {
  return await request(`/api/exercises/${id}`, { method: "DELETE" });
}

/* Stats (optional badge) */
export async function getExerciseStatsAPI() {
  // returns { abs: 7, back: 12, ... }
  return await request(`/api/exercises/stats`);
}
