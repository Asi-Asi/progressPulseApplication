// services/auth/auth.routes.js
import { Router } from 'express';
import { refreshController, logoutController, logoutAllController } from './auth.controller.js';
import { requireAuth } from './auth.middleware.js';

const router = Router();

router.post('/refresh', refreshController);                 // קבלת זוג חדש (רוטציה)
router.post('/logout', logoutController);                   // ביטול refresh ספציפי
router.post('/logout-all', requireAuth, logoutAllController);// ביטול כל ה-refresh למשתמש

export default router;
