import path from 'path';
import multer from 'multer';

const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 mb max size limit
    Storage: multer.diskStorage({
        destination: "uploads/",
        filename: (_req, file, cb) => {
            cb(null, file.originalname);
        },
    }),
    fileFilter: (_req, file, cb) => {
        let ext = path.extname(file.originalname);

        if(
            ext !== ".jpg" &&
            ext !== ".jpeg" &&
            ext !== ".png" &&
            ext !== ".webp" &&
            ext !== ".mp4"
        ) {
            cb(new Error(`Unsupported file type! ${ext}`), false);
            return;
        }
        cb(null, true)
    },
});
export default upload;