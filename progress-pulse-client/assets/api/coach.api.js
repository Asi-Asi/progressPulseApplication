// assets/api/coach.api.js
import { request } from './plan.api';

/** ------ Coach: code ------ */
export const getCoachCode = ({ token }) =>
  request('/api/coach/code', { token });

export const rotateCoachCode = ({ token }) =>
  request('/api/coach/code/new', { method: 'POST', token });

/** ------ Coach: requests ------ */
export const listJoinRequests = ({ token, limit = 50, skip = 0 } = {}) =>
  request(`/api/coach/requests?limit=${limit}&skip=${skip}`, { token });

export const approveJoinRequest = ({ token, linkId }) =>
  request(`/api/coach/requests/${linkId}/approve`, { method: 'PUT', token });

export const rejectJoinRequest = ({ token, linkId }) =>
  request(`/api/coach/requests/${linkId}/reject`, { method: 'PUT', token });

/** ------ Coach: subscribers ------ */
export const listSubscribers = ({ token, limit = 50, skip = 0 } = {}) =>
  request(`/api/coach/subscribers?limit=${limit}&skip=${skip}`, { token });

export const revokeSubscriber = ({ token, linkId }) =>
  request(`/api/coach/subscribers/${linkId}`, { method: 'DELETE', token });

/** ------ Coach: read-only trainee data ------ */
export const getTraineeHistory = ({ token, traineeId, limit = 20, skip = 0, from, to } = {}) => {
  const qs = new URLSearchParams();
  if (limit) qs.set('limit', String(limit));
  if (skip)  qs.set('skip', String(skip));
  if (from)  qs.set('from', from);
  if (to)    qs.set('to', to);
  const suffix = qs.toString() ? `?${qs}` : '';
  return request(`/api/coach/trainees/${traineeId}/history${suffix}`, { token });
};

export const getTraineeWorkout = ({ token, traineeId, workoutId }) =>
  request(`/api/coach/trainees/${traineeId}/workouts/${workoutId}`, { token });
