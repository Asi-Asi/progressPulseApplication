import {Router} from 'express';
import usersRouter from './services/users/users.routes.js';
import authRoutes from './services/auth/auth.routes.js';

const router = Router();


router.use('/users', usersRouter);
router.use('/auth', authRoutes);    // => /api/auth/*   (refresh/logout/logout-all)







export default router;