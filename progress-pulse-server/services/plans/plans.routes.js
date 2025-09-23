import express from 'express';
import { requireAuth } from '../auth/auth.middleware.js'; // או הנתיב אצלך
import {getMyPlan, overwriteMyPlan } from './plans.controller.js';

const plansRouter = express.Router();
plansRouter.use(requireAuth); // כל הנתיבים דורשים התחברות

plansRouter
    // Get current plan for the authenticated user
    .get('/plans/me', getMyPlan)

    // Overwrite (upsert) the current user's plan on "Finish Plan"
    .put('/plans/me', overwriteMyPlan)

export default plansRouter;