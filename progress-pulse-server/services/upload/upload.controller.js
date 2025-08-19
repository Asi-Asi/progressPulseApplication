import { uploadToCloud } from './upload.model.js';

export async function uploadToCloudinary(req, res) {
    try {
        let result = await uploadToCloud(req.file.path);

        res.status(200).json({
            message: 'File uploaded successfully',
            result
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: 'Internal server error'
        });
    }
}