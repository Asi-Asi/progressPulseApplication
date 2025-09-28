// services/coach/coach.links.db.js
import { MongoClient, ObjectId } from 'mongodb';

const COLL  = 'CoachLinks';   // links between coach <-> trainee
const USERS = 'Users';        // where coachCode is stored

function oid(id) { return new ObjectId(String(id)); }

/* =========================================================
 * Coach code (kept on Users collection)
 * ======================================================= */

export async function getCoachByCode(code) {
    let client = null;
    try {
        client = await MongoClient.connect(process.env.CONNECTION_STRING);
        const db = client.db(process.env.DB_NAME);
        return await db.collection(USERS).findOne(
        { coachCode: String(code) },
        { projection: { _id: 1, coachCode: 1 } }
        );
    } finally {
        if (client) await client.close();
    }
}

export async function getCoachCode(userId) {
    let client = null;
    try {
        client = await MongoClient.connect(process.env.CONNECTION_STRING);
        const db = client.db(process.env.DB_NAME);
        const u = await db.collection(USERS).findOne(
        { _id: oid(userId) },
        { projection: { coachCode: 1 } }
        );
        return u?.coachCode ?? null;
    } finally {
        if (client) await client.close();
    }
}

export async function setCoachCode(userId, code) {
    let client = null;
    try {
        client = await MongoClient.connect(process.env.CONNECTION_STRING);
        const db = client.db(process.env.DB_NAME);
        const res = await db.collection(USERS).updateOne(
        { _id: oid(userId) },
        { $set: { coachCode: String(code), coachCodeUpdatedAt: new Date() } }
        );
        return res.modifiedCount === 1;
    } finally {
        if (client) await client.close();
    }
}

export async function coachCodeExists(code) {
    let client = null;
    try {
        client = await MongoClient.connect(process.env.CONNECTION_STRING);
        const db = client.db(process.env.DB_NAME);
        const doc = await db.collection(USERS).findOne(
        { coachCode: String(code) },
        { projection: { _id: 1 } }
        );
        return !!doc;
    } finally {
        if (client) await client.close();
    }
}

/* =========================================================
 * CoachLinks collection
 * ======================================================= */

export const LinkStatus = Object.freeze({
    PENDING:  'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    REVOKED:  'revoked',
});

export async function createJoinRequest({ traineeId, coachId }) {
    let client = null;
    try {
        client = await MongoClient.connect(process.env.CONNECTION_STRING);
        const db = client.db(process.env.DB_NAME);
        const now = new Date();
        const doc = {
        traineeId: String(traineeId),
        coachId:   String(coachId),
        status:    LinkStatus.PENDING,
        createdAt: now,
        updatedAt: now,
        };
        const { insertedId } = await db.collection(COLL).insertOne(doc);
        return { ...doc, _id: insertedId };
    } finally {
        if (client) await client.close();
    }
}

export async function findActiveApprovedForTrainee(traineeId) {
    let client = null;
    try {
        client = await MongoClient.connect(process.env.CONNECTION_STRING);
        const db = client.db(process.env.DB_NAME);
        return await db.collection(COLL).findOne({
        traineeId: String(traineeId),
        status: LinkStatus.APPROVED,
        });
    } finally {
        if (client) await client.close();
    }
}

export async function findPendingForPair(traineeId, coachId) {
    let client = null;
    try {
        client = await MongoClient.connect(process.env.CONNECTION_STRING);
        const db = client.db(process.env.DB_NAME);
        return await db.collection(COLL).findOne({
        traineeId: String(traineeId),
        coachId:   String(coachId),
        status:    LinkStatus.PENDING,
        });
    } finally {
        if (client) await client.close();
    }
}

export async function findPendingRequestsByCoach(coachId, { limit = 50, skip = 0 } = {}) {
    let client = null;
    try {
        client = await MongoClient.connect(process.env.CONNECTION_STRING);
        const db = client.db(process.env.DB_NAME);
        const items = await db.collection(COLL).aggregate([
        { $match: { coachId: String(coachId), status: LinkStatus.PENDING } },
        { $sort: { createdAt: 1 } },
        { $skip: Number(skip) },
        { $limit: Number(limit) },

        // convert string traineeId -> ObjectId for the lookup
        { $addFields: {
            traineeObjId: {
                $convert: { input: "$traineeId", to: "objectId", onError: null, onNull: null }
            }
        }},

        // join Users
        {
            $lookup: {
            from: USERS,
            localField: "traineeObjId",
            foreignField: "_id",
            as: "trainee"
            }
        },
        { $unwind: { path: "$trainee", preserveNullAndEmptyArrays: true } },

        // surface name/email/avatar on the link
        {
            $addFields: {
            traineeFirstName: "$trainee.firstName",
            traineeLastName:  "$trainee.lastName",
            traineeEmail:     "$trainee.email",
            traineeAvatarUrl: "$trainee.avatarUrl",
            traineeName: {
                $trim: {
                input: { $concat: [
                    { $ifNull: ["$trainee.firstName", ""] }, " ",
                    { $ifNull: ["$trainee.lastName",  ""] }
                ]}
                }
            }
            }
        },

        // don’t return helper fields
        { $project: { trainee: 0, traineeObjId: 0 } }
        ]).toArray();

        return items;
    } finally {
        if (client) await client.close();
    }
}

export async function findSubscribersByCoach(coachId, { limit = 50, skip = 0 } = {}) {
    let client = null;
    try {
        client = await MongoClient.connect(process.env.CONNECTION_STRING);
        const db = client.db(process.env.DB_NAME);
        const items = await db.collection(COLL).aggregate([
        { $match: { coachId: String(coachId), status: LinkStatus.APPROVED } },
        { $sort: { updatedAt: -1 } },
        { $skip: Number(skip) },
        { $limit: Number(limit) },

        { $addFields: {
            traineeObjId: {
                $convert: { input: "$traineeId", to: "objectId", onError: null, onNull: null }
            }
        }},

        {
            $lookup: {
            from: USERS,
            localField: "traineeObjId",
            foreignField: "_id",
            as: "trainee"
            }
        },
        { $unwind: { path: "$trainee", preserveNullAndEmptyArrays: true } },

        {
            $addFields: {
            traineeFirstName: "$trainee.firstName",
            traineeLastName:  "$trainee.lastName",
            traineeEmail:     "$trainee.email",
            traineeAvatarUrl: "$trainee.avatarUrl",
            traineeName: {
                $trim: {
                input: { $concat: [
                    { $ifNull: ["$trainee.firstName", ""] }, " ",
                    { $ifNull: ["$trainee.lastName",  ""] }
                ]}
                }
            }
            }
        },

        { $project: { trainee: 0, traineeObjId: 0 } }
        ]).toArray();

        return items;
    } finally {
        if (client) await client.close();
    }
}

export async function getLinkById(linkId) {
    let client = null;
    try {
        client = await MongoClient.connect(process.env.CONNECTION_STRING);
        const db = client.db(process.env.DB_NAME);
        return await db.collection(COLL).findOne({ _id: oid(linkId) });
    } finally {
        if (client) await client.close();
    }
}

export async function approveLink(linkId, coachId) {
    let client = null;
    try {
        client = await MongoClient.connect(process.env.CONNECTION_STRING);
        const db = client.db(process.env.DB_NAME);
        const now = new Date();

        const filter = {
        _id: oid(linkId),
        status: LinkStatus.PENDING,
        $or: [
            { coachId: String(coachId) },
            ...(ObjectId.isValid(String(coachId)) ? [{ coachId: oid(coachId) }] : [])
        ]
        };

        const res = await db.collection(COLL).findOneAndUpdate(
        filter,
        { $set: { status: LinkStatus.APPROVED, updatedAt: now } },
        { returnDocument: 'after' }
        );

        
        if (!res.value) {
            const already = await db.collection(COLL).findOne({
                _id: oid(linkId),
                $or: [
                    { coachId: String(coachId) },
                    ...(ObjectId.isValid(String(coachId)) ? [{ coachId: oid(coachId) }] : [])
                ]
            });
            if (already && already.status === LinkStatus.APPROVED) {
                return { _conflict: 'already-approved', doc: already };
            }
            return null;
        }
        return res.value; // null אם לא נמצא/לא pending/לא שייך למאמן
        
    } finally {
        if (client) await client.close();
    }
}

export async function rejectLink(linkId, coachId) {
    let client = null;
    try {
        client = await MongoClient.connect(process.env.CONNECTION_STRING);
        const db = client.db(process.env.DB_NAME);

        const filter = {
        _id: oid(linkId),
        status: LinkStatus.PENDING,
        $or: [
            { coachId: String(coachId) },
            ...(ObjectId.isValid(String(coachId)) ? [{ coachId: oid(coachId) }] : [])
        ],
        };

        const res = await db.collection(COLL).findOneAndUpdate(
        filter,
        { $set: { status: LinkStatus.REJECTED, updatedAt: new Date() } },
        { returnDocument: 'after' }
        );

        if (res.value) return res.value;

        // אם לא נמצא — נבדוק האם כבר נדחה (קונפליקט במקום 404 שגוי)
        const already = await db.collection(COLL).findOne({
        _id: oid(linkId),
        $or: [
            { coachId: String(coachId) },
            ...(ObjectId.isValid(String(coachId)) ? [{ coachId: oid(coachId) }] : [])
        ],
        });
        if (already && already.status === LinkStatus.REJECTED) {
        return { _conflict: 'already-rejected', doc: already };
        }

        return null; // לא נמצא / לא pending / לא שייך למאמן
    } finally {
        if (client) await client.close();
    }
}

export async function revokeLink(linkId, coachId) {
    let client = null;
    try {
        client = await MongoClient.connect(process.env.CONNECTION_STRING);
        const db = client.db(process.env.DB_NAME);

        const filter = {
        _id: oid(linkId),
        status: LinkStatus.APPROVED,
        $or: [
            { coachId: String(coachId) },
            ...(ObjectId.isValid(String(coachId)) ? [{ coachId: oid(coachId) }] : [])
        ],
        };

        const res = await db.collection(COLL).findOneAndUpdate(
        filter,
        { $set: { status: LinkStatus.REVOKED, updatedAt: new Date() } },
        { returnDocument: 'after' }
        );

        if (res.value) return res.value;

        // אם לא נמצא במסנן הראשי — בדוק אם כבר מבוטל ונחזיר קונפליקט
        const already = await db.collection(COLL).findOne({
        _id: oid(linkId),
        $or: [
            { coachId: String(coachId) },
            ...(ObjectId.isValid(String(coachId)) ? [{ coachId: oid(coachId) }] : [])
        ],
        });
        if (already && already.status === LinkStatus.REVOKED) {
        return { _conflict: 'already-revoked', doc: already };
        }

        return null; // לא נמצא / לא approved / לא שייך למאמן
    } finally {
        if (client) await client.close();
    }
}
export async function revokeAllApprovedForTrainee(traineeId) {
    let client = null;
    try {
        client = await MongoClient.connect(process.env.CONNECTION_STRING);
        const db = client.db(process.env.DB_NAME);
        const now = new Date();
        await db.collection(COLL).updateMany(
        { traineeId: String(traineeId), status: LinkStatus.APPROVED },
        { $set: { status: LinkStatus.REVOKED, updatedAt: now } }
        );
    } finally {
        if (client) await client.close();
    }
}

export async function traineeRevokeMyCoach(traineeId) {
    let client = null;
    try {
        client = await MongoClient.connect(process.env.CONNECTION_STRING);
        const db = client.db(process.env.DB_NAME);
        const now = new Date();
        const res = await db.collection(COLL).findOneAndUpdate(
        { traineeId: String(traineeId), status: LinkStatus.APPROVED },
        { $set: { status: LinkStatus.REVOKED, updatedAt: now } },
        { returnDocument: 'after' }
        );
        return res.value;
    } finally {
        if (client) await client.close();
    }
}

