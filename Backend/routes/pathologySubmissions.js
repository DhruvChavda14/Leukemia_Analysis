import express from 'express';
import pathologySubmissionController from '../controllers/pathologySubmissionController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import upload from '../middleware/multerUpload.js';

const router = express.Router();


router.post('/', authMiddleware, upload.array('images', 10), pathologySubmissionController.createSubmission);


router.get('/', authMiddleware, pathologySubmissionController.getSubmissions);


router.get('/:id', authMiddleware, pathologySubmissionController.getSubmissionById);

export default router;
