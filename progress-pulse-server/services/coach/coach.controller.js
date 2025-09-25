// services/coach/coach.controller.js

import { ObjectId } from 'mongodb';
import { Roles } from '../auth/roles.js';
import {
  // Coach code (stored on Users)
    getCoachByCode,
    coachCodeExists,
    getCoachCode,
    setCoachCode,

  // Coach–Trainee links
    createJoinRequest,
    findPendingForPair,
    findActiveApprovedForTrainee,
    findPendingRequestsByCoach,
    approveLink,
    rejectLink,
    findSubscribersByCoach,
    revokeLink,
    revokeAllApprovedForTrainee,
    traineeRevokeMyCoach,
} from './coach.links.db.js';

// If your workouts db uses different names — adjust the imports accordingly.
import {
    listHistoryDb,   // (filter, {limit, skip}) -> Workout[]
    getSession,         // (workoutId) -> Workout | null
    ymd
} from '../workouts/workouts.db.js';

/* =========================================================
 * Helpers
 * ======================================================= */

// Simple human-friendly alphanumeric code for coaches
function randomCoachCode(len = 7) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I to avoid confusion
    let out = '';
    for (let i = 0; i < len; i++) {
        out += chars[Math.floor(Math.random() * chars.length)];
    }
    return out;
}

/* =========================================================
 * Trainee actions
 * ======================================================= */

/**
 * Trainee -> request to join a coach using a code
 * Pre: requireAuth + requireTrainee
 */
export async function joinCoachByCode(req, res) {
    try {
        const traineeId = String(req.user?._id || '');
        if ((req.user?.rlv) !== Roles.TRAINEE) {
        return res.status(403).json({ message: 'Forbidden' });
        }

        const { code } = req.body ?? {};
        const joinCode = String(code || '').trim();
        if (!joinCode || joinCode.length < 5) {
        return res.status(400).json({ message: 'Code is required' });
        }

        const coach = await getCoachByCode(joinCode);
        if (!coach) return res.status(404).json({ message: 'Coach not found for code' });

        // Prevent duplicates
        const pending = await findPendingForPair(traineeId, coach._id);
        if (pending) return res.status(409).json({ message: 'Join request already pending' });

        // Enforce one active coach per trainee
        const active = await findActiveApprovedForTrainee(traineeId);
        if (active) return res.status(409).json({ message: 'You already have an active coach' });

        const created = await createJoinRequest({ traineeId, coachId: coach._id });
        return res.status(202).json({ message: 'Join request created', request: created });
    } catch (e) {
        console.error('joinCoachByCode error:', e);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

/**
 * Trainee -> get my current coach status (approved/none)
 * Pre: requireAuth + requireTrainee
 */
export async function getMyCoachStatus(req, res) {
    try {
        const traineeId = String(req.user?._id || '');
        const active = await findActiveApprovedForTrainee(traineeId);
        if (!active) return res.json({ status: 'none', link: null });
        return res.json({ status: 'approved', link: active });
    } catch (e) {
        console.error('getMyCoachStatus error:', e);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

/**
 * Trainee -> leave my coach (revoke current approved link)
 * Pre: requireAuth + requireTrainee
 */
export async function leaveMyCoach(req, res) {
    try {
        const traineeId = String(req.user?._id || '');
        const revoked = await traineeRevokeMyCoach(traineeId);
        if (!revoked) return res.status(409).json({ message: 'No active coach to revoke' });
        return res.json({ message: 'Coach link revoked', link: revoked });
    } catch (e) {
        console.error('leaveMyCoach error:', e);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

/* =========================================================
 * Coach actions (code, requests, subscribers)
 * ======================================================= */

/**
 * Coach -> get current coach code
 * Pre: requireAuth + requireCoach
 */
export async function getCoachCodeController(req, res) {
    try {
        const code = await getCoachCode(req.user._id);
        return res.json({ code: code || null });
    } catch (e) {
        console.error('getCoachCode error:', e);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

/**
 * Coach -> rotate (generate) a new coach code
 * Pre: requireAuth + requireCoach
 */
export async function rotateCoachCodeController(req, res) {
    try {
        const coachId = String(req.user._id);
        for (let i = 0; i < 5; i++) {
        const code = randomCoachCode(7);
        const exists = await coachCodeExists(code);
        if (!exists) {
            const ok = await setCoachCode(coachId, code);
            if (ok) return res.json({ code });
        }
        }
        return res.status(503).json({ message: 'Failed to generate unique code' });
    } catch (e) {
        console.error('rotateCoachCode error:', e);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

/**
 * Coach -> list pending join requests
 * Pre: requireAuth + requireCoach
 */
export async function listJoinRequests(req, res) {
    try {
        const { limit = 50, skip = 0 } = req.query ?? {};
        const items = await findPendingRequestsByCoach(req.user._id, { limit, skip });
        return res.json({ items, total: items.length });
    } catch (e) {
        console.error('listJoinRequests error:', e);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

/**
 * Coach -> approve a pending join request
 * Pre: requireAuth + requireCoach
 */
export async function approveJoinRequest(req, res) {
    try {
        const { linkId } = req.params;
        if (!ObjectId.isValid(linkId)) return res.status(400).json({ message: 'Invalid linkId' });

        // Transition pending -> approved (only if link belongs to this coach)
        const approved = await approveLink(linkId, req.user._id);
        if (!approved) return res.status(404).json({ message: 'Request not found or not pending' });

        // Enforce "one active coach per trainee"
        await revokeAllApprovedForTrainee(approved.traineeId);

        // Note: revokeAllApprovedForTrainee revokes APPROVED links; our current link was just approved.
        // If your implementation revokes *all* including current — re-approve again here.

        return res.json({ message: 'Request approved', link: approved });
    } catch (e) {
        console.error('approveJoinRequest error:', e);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

/**
 * Coach -> reject a pending join request
 * Pre: requireAuth + requireCoach
 */
export async function rejectJoinRequest(req, res) {
    try {
        const { linkId } = req.params;
        if (!ObjectId.isValid(linkId)) return res.status(400).json({ message: 'Invalid linkId' });

        const rejected = await rejectLink(linkId, req.user._id);
        if (!rejected) return res.status(404).json({ message: 'Request not found or not pending' });

        return res.json({ message: 'Request rejected', link: rejected });
    } catch (e) {
        console.error('rejectJoinRequest error:', e);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

/**
 * Coach -> list current subscribers (approved links)
 * Pre: requireAuth + requireCoach
 */
export async function listSubscribers(req, res) {
    try {
        const { limit = 50, skip = 0 } = req.query ?? {};
        const items = await findSubscribersByCoach(req.user._id, { limit, skip });
        return res.json({ items, total: items.length });
    } catch (e) {
        console.error('listSubscribers error:', e);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

/**
 * Coach -> revoke an active subscriber
 * Pre: requireAuth + requireCoach
 */
export async function revokeSubscriber(req, res) {
    try {
        const { linkId } = req.params;
        if (!ObjectId.isValid(linkId)) return res.status(400).json({ message: 'Invalid linkId' });

        const revoked = await revokeLink(linkId, req.user._id);
        if (!revoked) return res.status(404).json({ message: 'Subscription not found or not active' });

        return res.json({ message: 'Subscriber revoked', link: revoked });
    } catch (e) {
        console.error('revokeSubscriber error:', e);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

/* =========================================================
 * Coach read-only: trainee history
 * ======================================================= */

/**
 * Coach -> read trainee workouts history (read-only)
 * Pre: requireAuth + requireCoach + requireCoachAccess('traineeId')
 */
export async function getTraineeHistoryController(req, res) {
    try {
        const traineeId = String(req.params.traineeId || '');
        const { limit = 50, skip = 0, from, to } = req.query ?? {};

        // Build filter for DB
        const toY = v => v ? ymd(new Date(v)) : undefined;

        const { items, total } = await listHistoryDb(traineeId, {
            from: toY(from),
            to: toY(to),
            limit: Number(limit),
            skip: Number(skip)
        });

        return res.json({ items, total });
    } catch (e) {
        console.error('getTraineeHistoryController error:', e);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

/**
 * Coach -> read a specific trainee workout (read-only)
 * Pre: requireAuth + requireCoach + requireCoachAccess('traineeId')
 */
export async function getTraineeWorkoutController(req, res) {
    try {
        const { traineeId, workoutId } = req.params;
        if (!ObjectId.isValid(workoutId)) {
        return res.status(400).json({ message: 'Invalid workoutId' });
        }

        const w = await getSession(traineeId,workoutId);
        if (!w || String(w.userId) !== String(traineeId)) {
        return res.status(404).json({ message: 'Workout not found' });
        }

        return res.json(w); // strictly read-only
    } catch (e) {
        console.error('getTraineeWorkoutController error:', e);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
