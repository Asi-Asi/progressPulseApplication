// services/plans/plans.model.js
import { ObjectId } from 'mongodb';

/** Public helper (exported in case you need it elsewhere) */
export function isValidObjectIdString(s) {
  return typeof s === 'string' && /^[0-9a-fA-F]{24}$/.test(s);
}

/**
 * Validate a Plan payload:
 * - payload.days is an array with length 1..7
 * - each day is an object
 * - each day has a non-empty array under either `items` or `exercises`
 * - each element has { exerciseId: 24-hex, sets: int 1..20 }
 */
export function validatePlanPayload(payload = {}) {
    const errors = [];

    if (!Array.isArray(payload.days)) {
        errors.push('days must be an array');
    } else {
        const len = payload.days.length;
        if (len < 1 || len > 7) {
        errors.push('days length must be between 1 and 7');
        }

    payload.days.forEach((d, i) => {
        if (!d || typeof d !== 'object') {
            errors.push(`days[${i}] must be an object`);
            return;
        }

        const list = Array.isArray(d.items) ? d.items : d.exercises;
        if (!Array.isArray(list) || list.length === 0) {
            errors.push(`days[${i}].items (or exercises) must be a non-empty array`);
            return;
        }

        list.forEach((ex, j) => {
            if (!ex || typeof ex !== 'object') {
            errors.push(`days[${i}].items[${j}] must be an object`);
            return;
            }

            const exId = String(ex.exerciseId ?? '');
            if (!isValidObjectIdString(exId)) {
            errors.push(`days[${i}].items[${j}].exerciseId must be a 24-hex ObjectId string`);
            }

            const setsNum = Number(ex.sets);
            if (!Number.isInteger(setsNum) || setsNum < 1 || setsNum > 20) {
            errors.push(`days[${i}].items[${j}].sets must be an integer between 1 and 20`);
            }
        });
        });
    }

    return { valid: errors.length === 0, errors };
}

/**
 * Normalize payload for storage:
 * - userId -> ObjectId
 * - accept `items` or `exercises`, always store as `exercises`
 * - dayNumber preserved if provided, otherwise index+1
 * - coerce sets into [1..20] ints
 */
export function normalizePlanForStore(payload = {}, userId) {
    return {
        userId: new ObjectId(String(userId)),
        days: (payload.days || []).map((d, idx) => {
        const src = Array.isArray(d.items) ? d.items : (d.exercises || []);
        return {
            dayNumber: Number(d.dayNumber ?? idx + 1),
            exercises: src.map((ex) => ({
            exerciseId: new ObjectId(String(ex.exerciseId)),
            sets: Math.max(1, Math.min(20, parseInt(ex.sets ?? 1, 10))),
            })),
        };
        }),
        locked: Boolean(payload.locked) || false,
    };
}
