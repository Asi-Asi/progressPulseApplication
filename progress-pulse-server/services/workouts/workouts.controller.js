import { ObjectId } from 'mongodb';
import { validateOpen, validateSetPayload } from './workouts.model.js';
import {
    getTodayOpenSession, snapshotPlanDay, createOpenSession, getSession,
    addExercise, removeExerciseDb, addSetDb, updateSetDb, removeSetDb,
    closeSessionDb, maxByExercise, listHistoryDb,
    discardSessionDb
} from './workouts.db.js';


// Get today's open session (if any)
export async function getTodaySession(req, res, next) {
    try {
        const session = await getTodayOpenSession(req.user._id);
        // מחזיר null אם אין סשן פתוח להיום
        return res.json(session || null);
    } catch (err) { next(err); }
}
// Create a new session from a plan's day (if not already open today)
export async function createSessionFromPlan(req,res,next){
    const userId = req.user._id;
    const { fromPlanId, planDay } = req.body||{};
    const e = validateOpen({ fromPlanId, planDay }); if(e) return res.status(400).json({ message:e });
    try{
        const exists = await getTodayOpenSession(userId); if(exists) return res.json(exists);
        const planned = await snapshotPlanDay(userId, fromPlanId, planDay);
        if(!planned) return res.status(404).json({ message:'Plan or day not found' });
        const doc = await createOpenSession(userId, fromPlanId, planDay, planned);
        res.status(201).json(doc);
    } catch(err){ next(err); }
}

export async function getSessionView(req,res,next){
    const userId = req.user._id; const { sessionId } = req.params;
    if(!ObjectId.isValid(sessionId)) return res.status(400).json({ message:'Invalid id' });
    try{
        const session = await getSession(userId, sessionId);
        if(!session) return res.status(404).json({ message:'Session not found' });
        const ids = new Set([
        ...(session.planned||[]).map(p=>String(p.exerciseId)),
        ...(session.exercises||[]).map(e=>String(e.exerciseId)),
        ]);
        const maxMap = await maxByExercise(userId, [...ids]);
        res.json({ session, maxByExercise: maxMap });
    } catch(err){ next(err); }
}



export async function addExerciseToSession(req,res,next){
    const userId = req.user._id; const { sessionId } = req.params; const { exerciseId } = req.body||{};
    if(!ObjectId.isValid(sessionId) || !ObjectId.isValid(exerciseId)) return res.status(400).json({ message:'Invalid ids' });
    try{
        const val = await addExercise(userId, sessionId, exerciseId);
        if (val === 'CLOSED') return res.status(409).json({ message: 'Session is closed' });
        if (val === null) return res.status(404).json({ message: 'Session not found' });
        res.json(val);
    } catch(err){ next(err); }
}


export async function removeExercise(req, res, next) {
    const userId = req.user._id;
    const { sessionId, exerciseId } = req.params;
    try {
        const val = await removeExerciseDb(userId, sessionId, exerciseId);
        if (val === 'CLOSED') return res.status(409).json({ message: 'Session is closed' });
        if (!val)             return res.status(404).json({ message: 'Session not found' });
        res.json(val); // מחזיר את הסשן לאחר המחיקה
    } catch (err) { next(err); }
}

export async function addSet(req, res) {
    try {
        const { sessionId, exerciseId } = req.params;
        const reps   = Number(req.body?.reps);
        const weight = Number(req.body?.weight);

        const err = validateSetPayload({ reps, weight });
        if (err) return res.status(400).json({ message: err });

        const doc = await addSetDb(req.user._id, sessionId, exerciseId, { reps, weight });
        if (doc === null)   return res.status(404).json({ message: 'Session not found' });
        if (doc === 'CLOSED') return res.status(409).json({ message: 'Session already closed' });
        if (doc === 'NO_EX')  return res.status(404).json({ message: 'Exercise not found' });

        return res.json(doc);
    } catch (e) {
        return res.status(500).json({ message: 'Add set failed' });
    }
}

export async function updateSet(req, res) {
    try {
        const { sessionId, exerciseId } = req.params;
        const setNumber = Number(req.params.setNumber);   // <<<<<<<<<< חשוב
        const reps   = Number(req.body.reps);
        const weight = Number(req.body.weight);

        if (!Number.isInteger(setNumber) || setNumber < 1)
        return res.status(400).json({ message: 'Bad setNumber' });

        const bad = validateSetPayload({ reps, weight });
        if (bad) return res.status(400).json({ message: bad });

        const out = await updateSetDb(req.user._id, sessionId, exerciseId, setNumber, { reps, weight });
        if (out === null)      return res.status(404).json({ message: 'Session not found' });
        if (out === 'CLOSED')  return res.status(409).json({ message: 'Session is closed' });
        if (out === 'NO_EX')   return res.status(404).json({ message: 'Exercise not found' });
        if (out === 'NO_SET')  return res.status(404).json({ message: 'Set not found' });

        res.json(out);
    } catch (e) {
        res.status(500).json({ message: 'Server error' });
    }
}

export async function removeSet(req, res) {
    try {
        const { sessionId, exerciseId } = req.params;
        const setNumber = Number(req.params.setNumber); // <<< חשוב!
        if (!Number.isInteger(setNumber) || setNumber < 1)
        return res.status(400).json({ message: 'Bad setNumber' });

        const doc = await removeSetDb(req.user._id, sessionId, exerciseId, setNumber);
        if (doc === null)     return res.status(404).json({ message: 'Session not found' });
        if (doc === 'CLOSED') return res.status(409).json({ message: 'Session already closed' });
        if (doc === 'NO_EX')  return res.status(404).json({ message: 'Exercise not found' });

        return res.json(doc);
    } catch (e) {
        return res.status(500).json({ message: 'Remove set failed' });
    }
}

export async function closeSessionWithResults(req,res,next){
    const userId = req.user._id; const { sessionId } = req.params;
    try{
        const doc = await closeSessionDb(userId, sessionId);
        if(!doc) return res.status(404).json({ message:'Session not found or already closed' });
        res.json(doc);
    } catch(err){ next(err); }
}


// DELETE-like (דרך POST) על /sessions/:sessionId/discard
export async function discardSession(req, res, next) {
    const userId = req.user._id;
    const { sessionId } = req.params;

    if (!ObjectId.isValid(sessionId)) {
        return res.status(400).json({ message: 'Invalid id' });
    }

    try {
        // נבדוק אם קיים בכלל, כדי להחזיר סטטוס מדויק
        const doc = await getSession(userId, sessionId);
        if (!doc) {
        return res.status(404).json({ message: 'Session not found' });
        }
        if (doc.status === 'closed') {
        return res.status(409).json({ message: 'Session already closed' });
        }

        // פתוח → מוחקים
        const ok = await discardSessionDb(userId, sessionId);
        if (!ok) {
        // נדיר: מרוץ/שינוי מצב
        return res.status(404).json({ message: 'Session not found' });
        }

        return res.status(204).send(); // No Content
    } catch (err) {
        next(err);
    }
}

// History (me)
export async function listMyHistory(req,res,next){
    const userId = req.user._id; const { from,to,skip,limit } = req.query;
    try{ res.json(await listHistoryDb(userId, {from,to,skip,limit})); } catch(err){ next(err); }
}
export async function getMyWorkoutById(req,res,next){
    const userId = req.user._id; const { workoutId } = req.params;
    if(!ObjectId.isValid(workoutId)) return res.status(400).json({ message:'Invalid id' });
    try{
        const session = await getSession(userId, workoutId);
        if(!session || session.status!=='closed') return res.status(404).json({ message:'Not found' });
        res.json(session);
    } catch(err){ next(err); }
}




// Coach (נשאר כמו קודם – שימוש בבדיקת גישה שלך)
export async function listTraineeHistory(req,res,next){ /* ... כמו שהצגתי לך קודם ... */ }
export async function getTraineeWorkoutById(req,res,next){ /* ... */ }
