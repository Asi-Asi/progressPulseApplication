import {Router} from 'express';
import {getAllUsers, addUser, login, deleteUserById,updateUserById, register} from './users.controller.js';
const usersRouter = Router();

usersRouter
    .get('/', getAllUsers)
    .post('/', addUser)    
    .post('/register', register)
    .post('/login', login)
    .put('/:id', updateUserById)
    .delete('/:id', deleteUserById);
    

export default usersRouter;