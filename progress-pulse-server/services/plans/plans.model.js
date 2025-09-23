// services/plans/plans.model.js
import { ObjectId } from 'mongodb';

// Helper: validate a 24-hex string (ObjectId)
function isValidObjectIdString(s) {
  return typeof s === 'string' && /^[0-9a-fA-F]{24}$/.test(s);
}

/**
 * Minimal validation for a Plan payload:
 * - days: array length 1..7
 * - each day has a non-empty exercises array
 * - each exercise has exerciseId (24-hex string) and sets (integer 1..20)
 * - no names, no weights, no reps
 */
export function validatePlanPayload(payload) {
const errors = [];

    if (!Array.isArray(payload.days)) {
        errors.push('days must be an array');
    } else {
            if (payload.days.length < 1 || payload.days.length > 7) {
                errors.push('days length must be between 1 and 7');
            }

            payload.days.forEach((d, i) => {
                if (!d || typeof d !== 'object') {
                    errors.push(`days[${i}] must be an object`);
                    return;
                }

                if (!Array.isArray(d.exercises) || d.exercises.length === 0) {
                    errors.push(`days[${i}].exercises must be a non-empty array`);
                    return;
                }

                d.exercises.forEach((ex, j) => {
                    if (!ex || typeof ex !== 'object') {
                        errors.push(`days[${i}].exercises[${j}] must be an object`);
                        return;
                    }
                    if (!isValidObjectIdString(ex.exerciseId)) {
                        errors.push(`days[${i}].exercises[${j}].exerciseId must be a 24-hex ObjectId string`);
                    }
                    if (typeof ex.sets !== 'number' || !Number.isInteger(ex.sets) || ex.sets < 1 || ex.sets > 20) {
                        errors.push(`days[${i}].exercises[${j}].sets must be an integer between 1 and 20`);
                    }
                });
            });
        }
    return { valid: errors.length === 0, errors };
}

/**
 * Normalize payload into a DB document:
 * - userId -> ObjectId
 * - convert exerciseId strings to ObjectId
 * - days are ordered, dayNumber = index+1
 * - keep only { exerciseId, sets }, and optional locked boolean
 */
export function normalizePlanForStore(payload, userId) {
    return {
        userId: new ObjectId(userId),
        days: (payload.days || []).map((d, idx) => ({
            dayNumber: idx + 1,
            exercises: (d.exercises || []).map(ex => ({
                exerciseId: new ObjectId(String(ex.exerciseId)),
                sets: Math.max(1, Math.min(20, parseInt(ex.sets ?? 1, 10))),
            })),
        })),
        locked: Boolean(payload.locked) || false,
    };
}
