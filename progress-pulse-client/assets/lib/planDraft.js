// assets/lib/planDraft.js
import { useEffect, useState } from 'react';


const store = {
  days: [],                 // [{ id, name, locked:false, exercises:[{ id, name?, muscle?, sets:number }] }]
  selectedDayId: null,
  planLocked: false,
  listeners: new Set(),
};

function emit() {
  const snapshot = {
    days: store.days.map(d => ({
      ...d,
      exercises: d.exercises.map(e => ({ ...e })),
    })),
    selectedDayId: store.selectedDayId,
    planLocked: store.planLocked,
  };
  for (const cb of store.listeners) cb(snapshot);
}

export const planDraft = {
  getState() {
    return { days: store.days, selectedDayId: store.selectedDayId, planLocked: store.planLocked };
  },

  subscribe(cb) {
    store.listeners.add(cb);
    return () => store.listeners.delete(cb);
  },

  // ---- core helpers ----
  replaceAllDays(mappedDays) {               // replace entire plan from mapped array
    store.days = Array.isArray(mappedDays) ? mappedDays.map(d => ({
      id: Number(d.id),
      name: d.name ?? `Day ${d.id}`,
      locked: !!d.locked,
      exercises: Array.isArray(d.exercises) ? d.exercises.map(ex => ({
        id: ex.id,                           // required
        name: ex.name ?? `#${ex.id}`,        // optional meta
        muscle: ex.muscle ?? '',
        sets: Number(ex.sets ?? 1),
      })) : [],
    })) : [];

    store.selectedDayId = store.days[0]?.id ?? null;
    store.planLocked = false;                // server doesn't track lock; keep client lock
    emit();
  },

  hydrateFromServer(serverDays) {            // map server -> local
    const mapped = (serverDays || []).map(d => ({
      id: Number(d.dayNumber),               // dayNumber -> id
      name: `Day ${d.dayNumber}`,
      locked: false,
      exercises: (d.items || []).map(it => ({
        id: it.exerciseId,                   // only id known now
        name: `#${it.exerciseId}`,           // placeholder until we enrich from /exercises
        muscle: '',
        sets: Number(it.sets ?? 1),
      })),
    }));
    this.replaceAllDays(mapped);
  },

  toServerPayload() {                        // map local -> server
    const days = store.days
      .map((d, idx) => ({
        dayNumber: d.id ?? (idx + 1),
        items: (d.exercises || []).map(ex => ({
          exerciseId: ex.id,
          sets: Number(ex.sets ?? 1),
        })),
      }))
      .filter(d => d.items.length > 0);
    return { days };
  },

  reset() {                                  // optional: clear everything (e.g., on logout)
    store.days = [];
    store.selectedDayId = null;
    store.planLocked = false;
    emit();
  },

  // ---- plan/day creation & selection ----
  createDays(n) {
    const count = Math.max(1, Math.min(7, Number(n) || 0));
    store.days = Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      name: `Day ${i + 1}`,
      locked: false,
      exercises: [],
    }));
    store.selectedDayId = store.days[0]?.id ?? null;
    store.planLocked = false; // new plan is editable
    emit();
  },

  upsertDayCount(n) {      // change #days without nuking existing content
    const count = Math.max(1, Math.min(7, Number(n) || 0));
    const byId = new Map(store.days.map(d => [d.id, d]));
    const next = [];
    for (let i = 1; i <= count; i++) {
      const prev = byId.get(i);
      next.push(prev ? { ...prev, id: i, name: `Day ${i}` } : {
        id: i, name: `Day ${i}`, locked: false, exercises: [],
      });
    }
    store.days = next;
    if (!store.days.some(d => d.id === store.selectedDayId)) {
      store.selectedDayId = store.days[0]?.id ?? null;
    }
    emit();
  },

  setSelectedDayId(id) {
    store.selectedDayId = Number(id);
    emit();
  },

  // ---- locking / unlocking ----
  lockDay(dayId) {
    const day = store.days.find(d => d.id === Number(dayId));
    if (!day) return;
    day.locked = true;
    emit();
  },
  unlockDay(dayId) {
    const day = store.days.find(d => d.id === Number(dayId));
    if (!day) return;
    day.locked = false;
    emit();
  },
  lockPlan() {
    store.planLocked = true;
    emit();
  },
  unlockPlan() {
    store.planLocked = false;
    emit();
  },

  // ---- mutations with guards ----
  addExercise(dayId, exercise, initialSets = 1) {
    if (store.planLocked) return;
    const day = store.days.find(d => d.id === Number(dayId));
    if (!day || day.locked) return;

    // avoid duplicates by exercise.id
    const exId = exercise.id;
    if (exId && day.exercises.some(e => e.id === exId)) return;

    day.exercises.push({
      id: exId,
      name: exercise.name ?? `#${exId}`,
      muscle: exercise.muscle ?? '',
      sets: Number(exercise.sets ?? initialSets),
    });
    emit();
  },

  setSets(dayId, index, value) {
    if (store.planLocked) return;
    const day = store.days.find(d => d.id === Number(dayId));
    if (!day || day.locked || !day.exercises[index]) return;
    const next = Math.max(1, Math.min(20, Number(value) || 1));
    day.exercises[index].sets = next;
    emit();
  },

  incrementSets(dayId, index, delta = 1) {
    if (store.planLocked) return;
    const day = store.days.find(d => d.id === Number(dayId));
    if (!day || day.locked || !day.exercises[index]) return;
    const cur = Number(day.exercises[index].sets) || 0;
    const next = Math.max(1, Math.min(20, cur + delta));
    day.exercises[index].sets = next;
    emit();
  },

  removeExercise(dayId, index) {
    if (store.planLocked) return;
    const day = store.days.find(d => d.id === Number(dayId));
    if (!day || day.locked) return;
    day.exercises.splice(index, 1);
    emit();
  },
};

export function usePlanDraft() {
  const [state, setState] = useState(planDraft.getState());
  useEffect(() => planDraft.subscribe(setState), []);
  return {
    days: state.days,
    selectedDayId: state.selectedDayId,
    planLocked: state.planLocked,
    actions: {
      createDays: planDraft.createDays,
      upsertDayCount: planDraft.upsertDayCount,     // ← חדש
      replaceAllDays: planDraft.replaceAllDays,     // ← חדש
      hydrateFromServer: planDraft.hydrateFromServer, // ← חדש
      toServerPayload: planDraft.toServerPayload,   // ← חדש
      reset: planDraft.reset,                       // ← אופציונלי
      setSelectedDayId: planDraft.setSelectedDayId,
      addExercise: planDraft.addExercise,
      setSets: planDraft.setSets,
      incrementSets: planDraft.incrementSets,
      removeExercise: planDraft.removeExercise,
      lockDay: planDraft.lockDay,
      unlockDay: planDraft.unlockDay,
      lockPlan: planDraft.lockPlan,
      unlockPlan: planDraft.unlockPlan,
    },
  };
}
