import { ObjectId } from 'mongodb';

export const isId = (id) => ObjectId.isValid(id);

export function validateOpen({ fromPlanId, planDay }) {
    if (!isId(fromPlanId)) return 'Invalid fromPlanId';
    if (!Number.isInteger(planDay) || planDay < 1 || planDay > 7) return 'Invalid planDay';
    return null;
}

export function validateSetPayload({ reps, weight }) {
    if (!Number.isFinite(reps) || reps < 0) return 'Bad reps';
    if (!Number.isFinite(weight) || weight < 0) return 'Bad weight';
    return null;
}
