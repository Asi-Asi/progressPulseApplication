// לפני: export const MUSCLES = ['Abs','Back','Biceps', ...]

// נרמול: שומרים גם רשימת slug-ים ב-lowercase וגם map לתצוגה/DB
export const MUSCLE_SLUGS = [
  'abs','back','biceps','chest','forearms','legs','shoulders','triceps'
];
export const MUSCLE_LABEL_BY_SLUG = {
  abs: 'Abs', back: 'Back', biceps: 'Biceps', chest: 'Chest',
  forearms: 'Forearms', legs: 'Legs', shoulders: 'Shoulders', triceps: 'Triceps',
};
export const MUSCLE_LABELS = Object.values(MUSCLE_LABEL_BY_SLUG);

export const TYPES = ['Compound', 'Isolation'];
export const EQUIPMENT = ['Barbell','Dumbbells','Machine','Cable','Bodyweight','Parallel Bars'];

// בולידציית list: קבל גם slug קטן וגם label קיים
export function validateListQuery(params = {}) {
  const errors = [];
  const out = {};

  if (params.muscle !== undefined) {
    const raw = String(params.muscle).trim();
    const slug = raw.toLowerCase();

    if (MUSCLE_SLUGS.includes(slug)) {
      out.muscle = MUSCLE_LABEL_BY_SLUG[slug]
    } else if (MUSCLE_LABELS.includes(raw)) {
      out.muscle = raw;                                 // כבר 'Abs'
    } else {
      errors.push(`muscle must be one of: ${[...MUSCLE_SLUGS, ...MUSCLE_LABELS].join(', ')}`);
    }
  }

  if (params.query !== undefined) {
    if (typeof params.query !== 'string') errors.push('query must be a string');
    else out.query = params.query;
  }

  const limit = Number(params.limit ?? 50);
  if (!Number.isFinite(limit) || limit < 1 || limit > 200) errors.push('limit must be 1..200');
  else out.limit = limit;

  const skip = Number(params.skip ?? 0);
  if (!Number.isFinite(skip) || skip < 0) errors.push('skip must be >= 0');
  else out.skip = skip;

  return { valid: errors.length === 0, errors, value: out };
}

export function normalizeNameRegex(q) {
  if (typeof q !== 'string' || !q.trim()) return null; // תחזיר null כשאין חיפוש
  const esc = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return { $regex: esc, $options: 'i' };
}

export function isValidObjectIdString(s) {
  return typeof s === 'string' && /^[0-9a-fA-F]{24}$/.test(s.trim());
}

// create/seed: אם תמשיך להכניס תרגילים - קבל slug והפוך ל-label
export function validateExerciseDoc(doc = {}) {
  const errors = [];
  if (!doc.name || typeof doc.name !== 'string') errors.push('name is required (string)');
  if (!doc.muscle) errors.push('muscle is required');

  else {
    const raw  = String(doc.muscle).trim();
    const slug = raw.toLowerCase();
    const normalized = MUSCLE_SLUGS.includes(slug) ? MUSCLE_LABEL_BY_SLUG[slug] : raw;
    if (!MUSCLE_LABELS.includes(normalized)) {
      errors.push(`muscle must be one of: ${MUSCLE_LABELS.join(', ')}`);
    } else {
      doc.muscle = normalized; // שומר כ-'Abs' כדי להתאים לנתונים הקיימים
    }
  }

  // השאר כמו שהיה (type/equipment וכו')
  return { valid: errors.length === 0, errors };
}
