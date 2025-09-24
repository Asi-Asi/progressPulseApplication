import express from 'express';
import { requireAuth, requireCoach } from '../auth/auth.middleware.js';
import {
    createSessionFromPlan, getSessionView,
    addExerciseToSession, removeExercise, addSet, updateSet, removeSet,
    closeSessionWithResults,
    listMyHistory, getMyWorkoutById,
    listTraineeHistory, getTraineeWorkoutById, getTodaySession
} from './workouts.controller.js';

const workoutRouter = express.Router();
workoutRouter.use(requireAuth);

workoutRouter

    // To open a new workout session from the user's plan based on day number
    .post('/sessions', createSessionFromPlan)                  // body: fromPlanId : <planId> + planDay<number>

    // To get details of a specific session  : exercises + sets + maxByExercise
    .get('/sessions/:sessionId/view', getSessionView)    
    
    // To get today's open session (if any)
    .get('/sessions/today', getTodaySession)

    //==================== Live tracking (Auto-save)====================//
            //========== The session should be open ==========//

    // to add an exercise to the session 
    .post('/sessions/:sessionId/exercises', addExerciseToSession) // body : { "exerciseId": "<EXERCISE_ID>" }

    .delete('/sessions/:sessionId/exercises/:exerciseId', removeExercise)   


    // To add sets for an exercise in the session
    .post('/sessions/:sessionId/exercises/:exerciseId/sets', addSet) // body : { "reps": <number>, "weight": <number> }

    //To update current set (by set number, 1..N)
    .put('/sessions/:sessionId/exercises/:exerciseId/sets/:setNumber', updateSet) // body : { "reps": <number>, "weight": <number> }

    // To remove a set (by set number, 1..N)
    .delete('/sessions/:sessionId/exercises/:exerciseId/sets/:setNumber', removeSet) // no body

    //==================== End of Live tracking ====================//

    // To close the session and save results (with optional notes)
    .post('/sessions/:sessionId/close', closeSessionWithResults)

    // Returns a list of a closed workout sessions (summary) for the current user
    .get('/history', listMyHistory)

    // Returns details of a specific closed workout session for the current user
    .get('/history/:workoutId', getMyWorkoutById)


    // Coach

    // Returns a list of closed workout sessions (summary) for a trainee
    .get('/coach/:traineeId/history', requireCoach, listTraineeHistory)

    // Returns details of a specific closed workout session for a trainee
    .get('/coach/:traineeId/history/:workoutId', requireCoach, getTraineeWorkoutById)

export default workoutRouter;
