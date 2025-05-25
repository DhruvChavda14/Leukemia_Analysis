import multer from 'multer';

const storage = multer.memoryStorage();

const imageFileFilter = (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

const upload = multer({ storage, fileFilter: imageFileFilter });

export default upload;
