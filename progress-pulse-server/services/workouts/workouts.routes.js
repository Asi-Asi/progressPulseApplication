import express from 'express';
import { requireAuth, requireCoach } from '../auth/auth.middleware.js';
import {
    createSessionFromPlan, getSessionView,
    addExerciseToSession, addSet, updateSet, removeSet,
    closeSessionWithResults,
    listMyHistory, getMyWorkoutById,
    listTraineeHistory, getTraineeWorkoutById,
} from './workouts.controller.js';

const workoutRouter = express.Router();
workoutRouter.use(requireAuth);

workoutRouter

    // Sessions 
    .post('/sessions', createSessionFromPlan)                  // fromPlanId + planDay
    .get('/sessions/:sessionId/view', getSessionView)         // planned + maxByExercise

    // Live tracking (Auto-save)
    .post('/sessions/:sessionId/exercises', addExerciseToSession)
    .post('/sessions/:sessionId/exercises/:exerciseId/sets', addSet)
    .put('/sessions/:sessionId/exercises/:exerciseId/sets/:setNumber', updateSet)
    .delete('/sessions/:sessionId/exercises/:exerciseId/sets/:setNumber', removeSet)

    // Finish
    .post('/sessions/:sessionId/close', closeSessionWithResults)

    // History (me)
    .get('/history', listMyHistory)
    .get('/history/:workoutId', getMyWorkoutById)

    // Coach
    .get('/coach/:traineeId/history', requireCoach, listTraineeHistory)
    .get('/coach/:traineeId/history/:workoutId', requireCoach, getTraineeWorkoutById)

export default workoutRouter;
