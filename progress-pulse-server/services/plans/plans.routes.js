import express from 'express';
import { requireAuth } from '../auth/auth.middleware.js'; // או הנתיב אצלך
import {getMyPlan, overwriteMyPlan } from './plans.controller.js';

const plansRouter = express.Router();


plansRouter.use(requireAuth);

plansRouter
    // Returns the current user's plan and the planId to be used for creating a workout session
    .get('/me', getMyPlan)

    // Overwrite (upsert) the current user's plan on "Finish Plan"
    .put('/me', overwriteMyPlan)

export default plansRouter;