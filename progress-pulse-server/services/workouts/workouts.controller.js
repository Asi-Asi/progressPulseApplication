import { ObjectId } from 'mongodb';
import { validateOpen, validateSetPayload } from './workouts.model.js';
import {
    getTodayOpenSession, snapshotPlanDay, createOpenSession, getSession,
    addExercise, addSetDb, updateSetDb, removeSetDb,
    closeSessionDb, maxByExercise, listHistoryDb
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

export async function addSet(req,res,next){
    const userId = req.user._id; const { sessionId, exerciseId } = req.params;
    const { reps, weight } = req.body||{}; const e = validateSetPayload({ reps, weight }); if(e) return res.status(400).json({ message:e });
    try{
        const val = await addSetDb(userId, sessionId, exerciseId, { reps, weight });
        if(val==='NO_EX') return res.status(404).json({ message:'Exercise not in session' });
        if(!val) return res.status(404).json({ message:'Session not found or not open' });
        res.json(val);
    } catch(err){ next(err); }
}

export async function updateSet(req,res,next){
    const userId = req.user._id; const { sessionId, exerciseId, setNumber } = req.params;
    const { reps, weight } = req.body||{}; const e = validateSetPayload({ reps, weight }); if(e) return res.status(400).json({ message:e });
    try{
        const val = await updateSetDb(userId, sessionId, exerciseId, Number(setNumber), { reps, weight });
        if(val==='NO_EX') return res.status(404).json({ message:'Exercise not in session' });
        if(val==='NO_SET') return res.status(404).json({ message:'Set not found' });
        if(!val) return res.status(404).json({ message:'Session not found or not open' });
        res.json(val);
    } catch(err){ next(err); }
}

export async function removeSet(req,res,next){
    const userId = req.user._id; const { sessionId, exerciseId, setNumber } = req.params;
    try{
        const val = await removeSetDb(userId, sessionId, exerciseId, Number(setNumber));
        if(val==='NO_EX') return res.status(404).json({ message:'Exercise not in session' });
        if(!val) return res.status(404).json({ message:'Session not found or not open' });
        res.json(val);
    } catch(err){ next(err); }
}

export async function closeSessionWithResults(req,res,next){
    const userId = req.user._id; const { sessionId } = req.params;
    try{
        const doc = await closeSessionDb(userId, sessionId);
        if(!doc) return res.status(404).json({ message:'Session not found or already closed' });
        res.json(doc);
    } catch(err){ next(err); }
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
