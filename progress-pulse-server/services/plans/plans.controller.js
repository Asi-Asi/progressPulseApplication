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
export async function getMyPlan(req, res) {
    try {
        const userId = req.user?._id || req.user?.id;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        // תביא את הדוקומנט הגולמי כמו היום
        const plan = await findPlanByUserId(userId);
        if (!plan) return res.status(404).json({ message: 'No plan found' });

        // אסוף את כל מזהי התרגילים בתוכנית
        const allIds = Array.from(new Set(
        (plan.days || []).flatMap(d => (d.exercises || []).map(it => String(it.exerciseId)))
        ));

        // טען מטא־דאטה של תרגילים בבאטצ' אחד
        const db = req.app.locals.db; // אם יש לך חיבור משותף. אם לא – תשתמש ב-MongoClient.connect כמו בשאר הקוד.
        const meta = await loadExercisesMeta(db, allIds);

        // החזר פורמט "ידידותי לקליינט": items עם name/muscle
            const payload = {
            days: (plan.days || []).map(d => ({
                dayNumber: d.dayNumber,
                items: (d.exercises || []).map(it => ({
                exerciseId: String(it.exerciseId),
                sets: Number(it.sets) || 1,
                name: meta[String(it.exerciseId)]?.name || null,
                muscle: meta[String(it.exerciseId)]?.muscle || null,
                })),
            })),
            };

            return res.json(payload);
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
