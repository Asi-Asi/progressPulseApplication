import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import router from './router.js';

const PORT = process.env.PORT || 5500;
const server = express();

//לאפשר גישה לשרת מכתובת אחרת
server.use(cors()); 

//לאפשר קליטת נתונים מגוף הבקשה
server.use(express.json({ extended: true, limit: '50mb' }));

//microservice routes
server.use('/api', router);

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});