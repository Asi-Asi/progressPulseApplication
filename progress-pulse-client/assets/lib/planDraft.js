// assets/lib/planDraft.js
import { useEffect, useState } from 'react';

const store = {
  days: [],                 // [{ id, name, locked: false, exercises: [{... , sets:number}] }]
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
    day.exercises.push({ ...exercise, sets: exercise.sets ?? initialSets });
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
