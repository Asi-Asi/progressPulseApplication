// services/exercises/exercises.model.js

// Allowed values used by the UI
export const MUSCLES = [
  'Abs','Back','Biceps','Chest','Forearms','Legs','Shoulders','Triceps'
];
export const TYPES = ['Compound', 'Isolation'];
export const EQUIPMENT = [
  'Barbell','Dumbbells','Machine','Cable','Bodyweight','Parallel Bars'
];

// 24-hex ObjectId string check
export function isValidObjectIdString(s) {
  return typeof s === 'string' && /^[0-9a-fA-F]{24}$/.test(s);
}

/**
 * Validate list query (read-only).
 * - muscle: optional, must be one of MUSCLES if provided
 * - query: optional string
 * - limit: 1..200
 * - skip: >=0
 */
export function validateListQuery(params = {}) {
  const errors = [];
  const out = {};

  if (params.muscle !== undefined) {
    if (typeof params.muscle !== 'string' || !params.muscle.trim()) {
      errors.push('muscle must be a non-empty string');
    } else if (!MUSCLES.includes(params.muscle.trim())) {
      errors.push(`muscle must be one of: ${MUSCLES.join(', ')}`);
    } else {
      out.muscle = params.muscle.trim();
    }
  }

  if (params.query !== undefined) {
    if (typeof params.query !== 'string') {
      errors.push('query must be a string');
    } else {
      out.query = params.query;
    }
  }

  const limit = Number(params.limit ?? 50);
  if (!Number.isFinite(limit) || limit < 1 || limit > 200) errors.push('limit must be 1..200');
  else out.limit = limit;

  const skip = Number(params.skip ?? 0);
  if (!Number.isFinite(skip) || skip < 0) errors.push('skip must be >= 0');
  else out.skip = skip;

  return { valid: errors.length === 0, errors, value: out };
}

// Safe case-insensitive regex for "name"
export function normalizeNameRegex(q) {
  if (!q) return null;
  const esc = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return { $regex: esc, $options: 'i' };
}

/**
 * Validate a single Exercise document (for seed/CRUD).
 * Minimal schema: { name, muscle, type, equipment }
 */
export function validateExerciseDoc(doc = {}) {
  const errors = [];
  if (!doc.name || typeof doc.name !== 'string') errors.push('name is required (string)');
  if (!doc.muscle || !MUSCLES.includes(doc.muscle)) errors.push(`muscle must be one of: ${MUSCLES.join(', ')}`);
  if (!doc.type || !TYPES.includes(doc.type)) errors.push(`type must be one of: ${TYPES.join(', ')}`);
  if (!doc.equipment || !EQUIPMENT.includes(doc.equipment)) errors.push(`equipment must be one of: ${EQUIPMENT.join(', ')}`);
  return { valid: errors.length === 0, errors };
}
