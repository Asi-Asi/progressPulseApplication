import { fileURLToPath } from 'url';
import path from 'path';
import multer from 'multer';

//שרשור ברמת המחשב לקובץ בו אני נמצא עכשיו
export const __filename = fileURLToPath(import.meta.url); 
//שרשור ברמת המחשב לתיקייה בה אני נמצא עכשיו
export const __dirname = path.dirname(__filename);

//יצירת הגדרות עבור שמירת קבצים
export const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'files/')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${file.fieldname}-${uniqueSuffix}.${file.originalname.split('.').pop()}`)
    }
});

//הגדרת העלאת קבצים
export const upload = multer({ storage: storage });