import {Router} from 'express';
import usersRouter from './services/users/users.routes.js';
import authRoutes from './services/auth/auth.routes.js';
import plansRouter from './services/plans/plans.routes.js';
import exercisesRouter from './services/exercises/exercises.routes.js';

const router = Router();


router.use('/users', usersRouter);  // => /api/users/*   (register)/(login) ....
router.use('/auth', authRoutes);    // => /api/auth/*   (refresh/logout)
router.use('/plans', plansRouter); // => /api/plans/*
router.use('/exercises', exercisesRouter); // => /api/exercises/*







export default router;