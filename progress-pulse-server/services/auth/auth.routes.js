// services/auth/auth.routes.js
import { Router } from 'express';
import { refreshController, logoutController } from './auth.controller.js';

const router = Router();

router.post('/refresh', refreshController);                 // קבלת זוג חדש (רוטציה)
router.post('/logout', logoutController);                   // ביטול refresh ספציפי

export default router;
