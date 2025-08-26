import {Router} from 'express';
import usersRouter from './services/users/users.routes.js';
// import musclesRouter from './services/muscles/muscles.routes.js';
// import exercisesRouter from './services/exercises/exercises.routes.js';

const router = Router();

// router.use('/upload', uploadRouter);

router.use('/users', usersRouter);

// router.use('/muscles', musclesRouter);

// router.use('/exercises', exercisesRouter);




export default router;