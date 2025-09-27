// services/plans/plans.controller.js
import { findPlanByUserId, upsertPlanForUser } from './plans.db.js';
import { validatePlanPayload, normalizePlanForStore } from './plans.model.js';

// helper קטן: בונה map של id->meta
async function loadExercisesMeta(db, ids) {
    if (!ids.length) return {};
    const rows = await db.collection('Exercises')
        .find({ _id: { $in: ids.map(id => new ObjectId(id)) } })
        .project({ name: 1, muscle: 1 })
        .toArray();
    const map = {};
    rows.forEach(r => { map[String(r._id)] = { name: r.name, muscle: r.muscle }; });
    return map;
}

// GET /api/plans/me
// GET /api/plans/me
export async function getMyPlan(req, res) {
    try {
        const userId = req.user?._id || req.user?.id;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const planView = await findPlanViewByUserId(userId);
        if (!planView) return res.status(404).json({ message: 'No plan found' });

        return res.json(planView); // { days:[{dayNumber, items:[{exerciseId,sets,name,muscle}]}] }
    } catch (err) {
        console.error('getMyPlan error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
}

// PUT /api/plans/me  -> overwrite (upsert) user's plan
export async function overwriteMyPlan(req, res) {
    try {
        const userId = req.user?._id || req.user?.id;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        // Validate incoming body (days 1..7, each with exercises, each exercise {exerciseId(ObjectId string), sets 1..20})
        const { valid, errors } = validatePlanPayload(req.body);
        if (!valid) return res.status(400).json({ message: 'Validation failed', errors });

        // Normalize body into a DB-friendly document (ObjectIds, dayNumber, etc.)
        const doc = normalizePlanForStore(req.body, userId);

        // Upsert by userId (replace existing or create new)
        const saved = await upsertPlanForUser(userId, doc);
        return res.status(200).json(saved);
    } catch (err) {
        console.error('overwriteMyPlan error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
}
