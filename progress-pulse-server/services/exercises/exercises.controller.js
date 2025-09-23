import { insertExercise ,findExercises, findExerciseById } from './exercises.db.js';
import { validateListQuery, normalizeNameRegex, isValidObjectIdString } from './exercises.model.js';

// GET /api/exercises
export async function listExercises(req, res) {
  try {
    const { valid, errors, value } = validateListQuery(req.query);
    if (!valid) return res.status(400).json({ message: 'Validation failed', errors });

    const filters = {};
    if (value.muscle) filters.muscle = value.muscle;
    if (value.query)  filters.nameRegex = normalizeNameRegex(value.query);

    const data = await findExercises(filters, { limit: value.limit, skip: value.skip });
    return res.json(data);
  } catch (err) {
    console.error('listExercises error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// GET /api/exercises/:id
export async function getExerciseById(req, res) {
  try {
    const id = String(req.params.id || '');
    if (!isValidObjectIdString(id)) return res.status(400).json({ message: 'Invalid id' });

    const ex = await findExerciseById(id);
    if (!ex) return res.status(404).json({ message: 'Not found' });
    return res.json(ex);
  } catch (err) {
    console.error('getExerciseById error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}



// POST /api/exercises  (admin only)
export async function createExercise(req, res) {
  try {
    // minimal body: { name, muscle, type, equipment }
    const { valid, errors } = validateExerciseDoc(req.body || {});
    if (!valid) return res.status(400).json({ message: 'Validation failed', errors });

    const { conflict, exercise } = await insertExercise({
      name: req.body.name.trim(),
      muscle: req.body.muscle,
      type: req.body.type,
      equipment: req.body.equipment,
    });

    if (conflict) return res.status(409).json({ message: 'Exercise already exists', exercise });
    return res.status(201).json(exercise);
  } catch (err) {
    console.error('createExercise error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}