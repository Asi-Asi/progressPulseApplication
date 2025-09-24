import { insertExercise ,findExercises, findExerciseById, deleteExerciseById,isExerciseInUse  } from './exercises.db.js';
import { validateListQuery, normalizeNameRegex, isValidObjectIdString, validateExerciseDoc } from './exercises.model.js';

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



// DELETE /api/exercises/:id  (admin only)
export async function deleteExercise(req, res) {
  try {
    const id = String(req.params.id || '');
    if (!isValidObjectIdString(id)) return res.status(400).json({ message: 'Invalid id' });

    // prevent deleting exercises referenced by any plan
    const inUse = await isExerciseInUse(id);
    if (inUse) return res.status(409).json({ message: 'Exercise is referenced by existing plans' });

    const ok = await deleteExerciseById(id);
    if (!ok) return res.status(404).json({ message: 'Not found' });

    return res.status(204).send();
  } catch (err) {
    console.error('deleteExercise error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}