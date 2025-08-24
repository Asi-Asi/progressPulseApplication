import {Router} from 'express';
import usersRouter from './services/users/users.routes.js';

const router = Router();

// router.use('/auth', authRouter);
// router.use('/upload', uploadRouter);

router.use('/users', usersRouter);


// router.get('/', (req, res) => res.send('API is running. Try /api/health'));

// router.get('/health', (req, res) => {
//   res.status(200).json({
//     ok: true,
//     uptime: process.uptime(),
//     timestamp: new Date().toISOString(),
//     env: process.env.NODE_ENV || 'production'
//   });
// });


export default router;