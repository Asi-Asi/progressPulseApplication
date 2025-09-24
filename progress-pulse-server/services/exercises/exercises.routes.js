import express from 'express';
import { requireAuth, requireAdmin } from '../auth/auth.middleware.js';
import { listExercises, getExerciseById , createExercise } from './exercises.controller.js';

const exercisesRouter = express.Router();

// All exercise endpoints require auth (read-only)
exercisesRouter.use(requireAuth);

// GET /api/exercises?muscle=back&query=lat&limit=50&skip=0
exercisesRouter
.get('/', listExercises)

// GET /api/exercises/:id  (single exercise)
.get('/:id', getExerciseById)


// POST /api/exercises  (admin only)
// Create (admin only)
.post('/', requireAdmin, createExercise)


export default exercisesRouter;
