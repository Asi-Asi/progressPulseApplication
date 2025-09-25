// services/coach/coach.middleware.js
import { ObjectId } from 'mongodb';
import { findActiveApprovedForTrainee } from './coach.links.db.js';

/**
 * Guard: ensures the requesting coach has an APPROVED link with the given trainee.
 * Use after requireAuth + requireCoach.
 * @param {string} traineeIdParam - name of the route param to read (default: 'traineeId')
 */
export function requireCoachAccess(traineeIdParam = 'traineeId') {
    return async (req, res, next) => {
        try {
        const coachId = String(req.user?._id || '');
        const traineeId = String(
            req.params?.[traineeIdParam] ?? req.query?.[traineeIdParam] ?? ''
        );

        if (!coachId || !traineeId || !ObjectId.isValid(traineeId)) {
            return res.status(400).json({ message: 'Invalid traineeId' });
        }

        const link = await findActiveApprovedForTrainee(traineeId);
        if (!link || link.coachId !== coachId) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        return next();
        } catch (err) {
        console.error('requireCoachAccess error:', err);
        return res.status(500).json({ message: 'Internal server error' });
        }
    };
}
