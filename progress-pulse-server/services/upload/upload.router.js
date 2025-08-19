import { Router } from 'express';
import { upload } from '../../globals.js';
import { uploadToCloudinary } from './upload.controller.js';

const uploadRouter = Router();

uploadRouter
    .post('/single', upload.single('file'), uploadToCloudinary)
    //.post('/multiple', upload.array('files'), uploadToCloudinary)

export default uploadRouter;