import {Router} from 'express';
import {getAllUsers, login, register, deleteUserById,updateUserById, getMe, updateMe, changeMyPassword} from './users.controller.js';
import { requireAuth, requireRole } from '../auth/auth.middleware.js';
import { Roles } from '../auth/roles.js';
import { ObjectId } from 'mongodb';




const usersRouter = Router();

//helper functions
function rejectNoSqlKeys(obj) {
    for (const k of Object.keys(obj || {})) {
        if (k.startsWith('$')) throw new Error('Illegal key');
        if (obj[k] && typeof obj[k] === 'object') rejectNoSqlKeys(obj[k]);
    }
}

function mustBeObjectId(req, res, next) {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });
    next();
}

function validateUpdateBody(req, res, next) {
    try {
        rejectNoSqlKeys(req.body);
        next();
    } catch {
    res.status(400).json({ message: 'Invalid input' });
    }
}
//End helper functions



// Routes
usersRouter
    .post('/register', register)
    .post('/login', login)
    

    
    //profile routes
    usersRouter.get('/me', requireAuth, getMe)
    usersRouter.put('/me', requireAuth, updateMe)
    usersRouter.put('/me/password', requireAuth, changeMyPassword)
    
    
    // Admin routes
    .get('/',  requireAuth , requireRole(Roles.ADMIN),getAllUsers)
    .put('/:id', requireAuth, requireRole(Roles.ADMIN), mustBeObjectId, validateUpdateBody, updateUserById)
    .delete('/:id', requireAuth, requireRole(Roles.ADMIN), mustBeObjectId, deleteUserById)


export default usersRouter;


