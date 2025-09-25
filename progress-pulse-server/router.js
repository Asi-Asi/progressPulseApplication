import {Router} from 'express';
import usersRouter from './services/users/users.routes.js';
import authRoutes from './services/auth/auth.routes.js';
import plansRouter from './services/plans/plans.routes.js';
import exercisesRouter from './services/exercises/exercises.routes.js';
import workoutRouter from './services/workouts/workouts.routes.js';
import coachRouter from './services/coach/coach.routes.js';

const router = Router();


router.use('/users', usersRouter);  // => /api/users/*   (register)/(login) ....
router.use('/auth', authRoutes);    // => /api/auth/*   (refresh/logout)
router.use('/plans', plansRouter); // => /api/plans/*
router.use('/exercises', exercisesRouter); // => /api/exercises/*
router.use('/workouts', workoutRouter); // => /api/workouts/*
router.use('/coach', coachRouter); // => /api/coach/*








export default router;