// services/coach/coach.routes.js
import { Router } from 'express';
import { requireAuth, requireCoach, requireTrainee } from '../auth/auth.middleware.js';
import { requireCoachAccess } from './coach.middleware.js';
import {
    joinCoachByCode, getMyCoachStatus, leaveMyCoach,
    getCoachCodeController, rotateCoachCodeController,
    listJoinRequests, approveJoinRequest, rejectJoinRequest,
    listSubscribers, revokeSubscriber,getTraineeHistoryController, getTraineeWorkoutController
} from './coach.controller.js';

const coachRouter = Router();

coachRouter

    //trainee actions
    .post('/join', requireAuth, requireTrainee, joinCoachByCode)
    .get('/my-coach', requireAuth, requireTrainee, getMyCoachStatus)
    .delete('/my-coach', requireAuth, requireTrainee, leaveMyCoach)


    //coach code management
    .get('/code', requireAuth, requireCoach, getCoachCodeController)
    .post('/code/new', requireAuth, requireCoach, rotateCoachCodeController)


    //coach managing requests and subscribers
    .get('/requests', requireAuth, requireCoach, listJoinRequests)
    .put('/requests/:linkId/approve', requireAuth, requireCoach, approveJoinRequest)
    .put('/requests/:linkId/reject', requireAuth, requireCoach, rejectJoinRequest)

    .get('/subscribers', requireAuth, requireCoach, listSubscribers)
    .delete('/subscribers/:linkId', requireAuth, requireCoach, revokeSubscriber)



    //trainee history and workout details
    .get('/trainees/:traineeId/history',
        requireAuth, requireCoach, requireCoachAccess('traineeId'),
        getTraineeHistoryController
    )

    .get('/trainees/:traineeId/workouts/:workoutId',
        requireAuth, requireCoach, requireCoachAccess('traineeId'),
        getTraineeWorkoutController
    )



export default coachRouter;
