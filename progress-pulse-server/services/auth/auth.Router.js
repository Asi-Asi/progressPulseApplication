import Router from 'express';
import { login, register } from './auth.controller.js';
import { upload } from '../../globals.js';
const authRouter = Router();

authRouter
    .post('/login', login)
    .post('/register', upload.single('file'), register)

export default authRouter;

/*
    Model --> Functions & Data
    View --> React
    Controller --> Router + Controller
*/
