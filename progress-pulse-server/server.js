import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import router from './router.js';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';





const PORT = process.env.PORT || 5500;
const server = express();

//לאפשר גישה לשרת מכתובת אחרת
server.use(cors()); 

//מגביל מספר בקשות בפרק זמן מסוים
server.use(helmet());
//rate limiting is 300 requests per 15 minutes
server.use(rateLimit({ windowMs: 15*60*1000, max: 300 }));



//לאפשר קליטת נתונים מגוף הבקשה
server.use(express.json({ extended: true, limit: '50mb' }));


//routes
server.use('/api', router);


server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});


