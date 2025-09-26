// לפני: export const MUSCLES = ['Abs','Back','Biceps', ...]

// נרמול: שומרים גם רשימת slug-ים ב-lowercase וגם map לתצוגה/DB
export const MUSCLE_SLUGS = [
  'abs','back','biceps','chest','forearms','legs','shoulders','triceps'
];
export const MUSCLE_LABEL_BY_SLUG = {
  abs: 'Abs', back: 'Back', biceps: 'Biceps', chest: 'Chest',
  forearms: 'Forearms', legs: 'Legs', shoulders: 'Shoulders', triceps: 'Triceps',
};

// בולידציית list: קבל גם slug קטן וגם label קיים
export function validateListQuery(params = {}) {
  const errors = [];
  const out = {};

  if (params.muscle !== undefined) {
    const raw = String(params.muscle).trim();
    const slug = raw.toLowerCase();
    if (!MUSCLE_SLUGS.includes(slug)) {
      errors.push(`muscle must be one of: ${MUSCLE_SLUGS.join(', ')}`);
    } else {
      // נשמור את הערך כפי שהוא ב־DB (label), שים לב שזה מסתדר גם אם ה־DB שלך הוא TitleCase
      out.muscle = MUSCLE_LABEL_BY_SLUG[slug]; // "Abs"
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

// create/seed: אם תמשיך להכניס תרגילים - קבל slug והפוך ל-label
export function validateExerciseDoc(doc = {}) {
  const errors = [];
  if (!doc.name || typeof doc.name !== 'string') errors.push('name is required (string)');

  const rawMuscle = doc.muscle && String(doc.muscle).trim();
  const slug = rawMuscle?.toLowerCase();
  if (!slug || !MUSCLE_SLUGS.includes(slug)) {
    errors.push(`muscle must be one of: ${MUSCLE_SLUGS.join(', ')}`);
  }

  // השאר כפי שהיה
  // ...
  return { valid: errors.length === 0, errors };
}
