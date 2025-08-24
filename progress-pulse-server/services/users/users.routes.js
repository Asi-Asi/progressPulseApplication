import {Router} from 'express';
import {getAllUsers, addUser, login, deleteUserById} from './users.controller.js';
const usersRouter = Router();

usersRouter
    .get('/', getAllUsers)
    .post('/register', addUser)
    .post('/login', login)
    .delete('/:id', deleteUserById);


export default usersRouter;