import {Router} from 'express';
// import authRouter from './services/auth/auth.router.js';
// import uploadRouter from './services/upload/upload.router.js';
import usersRouter from './services/users/users.routes.js';

const router = Router();

// router.use('/auth', authRouter);
// router.use('/upload', uploadRouter);
router.use('/users', usersRouter);


export default router;