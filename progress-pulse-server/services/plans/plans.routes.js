import express from 'express';
import { requireAuth } from '../auth/auth.middleware.js'; // או הנתיב אצלך
import {getMyPlan, overwriteMyPlan } from './plans.controller.js';

const plansRouter = express.Router();

// TEMP: log that this file is loaded in production
console.log('[plans] router file loaded');

plansRouter.use((req, _res, next) => {
  // TEMP: log any request that reaches the plans router
  console.log(`[plans] ${req.method} ${req.path}`);
  next();
});

plansRouter.use(requireAuth);

plansRouter
    // Get current plan for the authenticated user
    .get('/me', getMyPlan)

    // Overwrite (upsert) the current user's plan on "Finish Plan"
    .put('/me', overwriteMyPlan)

export default plansRouter;