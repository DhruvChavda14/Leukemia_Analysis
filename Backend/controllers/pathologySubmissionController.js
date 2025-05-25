import PathologySubmission from '../models/PathologySubmission.js';
import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';
import Report from '../models/Report.js';
import cloudinary from '../config/cloudinary.js';
import fs from 'fs';

const pathologySubmissionController = {

    async createSubmission(req, res) {
        try {
            //console.log('DEBUG req.files:', req.files);
            //console.log('DEBUG req.body:', req.body);
            const { patientId, doctorId, comment } = req.body;

            //console.log(patientId, "    ", doctorId)
            if (!patientId) {
                return res.status(400).json({ message: 'Patient ID is required.' });
            }
            if (!doctorId) {
                return res.status(400).json({ message: 'Doctor ID is required.' });
            }
            if (!comment || comment.trim() === '') {
                return res.status(400).json({ message: 'Comment is required.' });
            }


            const [patient, doctor] = await Promise.all([
                Patient.findById(patientId),
                Doctor.findById(doctorId)
            ]);

            if (!patient) {
                return res.status(404).json({ message: 'Patient not found.' });
            }
            if (!doctor) {
                return res.status(404).json({ message: 'Doctor not found.' });
            }


            const normalizedPatientId = patient._id;
            if (!doctor.patients) doctor.patients = [];
            if (!doctor.patients.some(pid => pid.toString() === normalizedPatientId.toString())) {
                doctor.patients.push(normalizedPatientId);
                await doctor.save();
            }


            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ message: 'At least one image file is required.' });
            }

            function uploadBufferToCloudinary(buffer, filename) {
                return new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        { folder: 'predictions', public_id: filename },
                        (error, result) => {
                            if (error) return reject(error);
                            resolve(result.secure_url);
                        }
                    );
                    stream.end(buffer);
                });
            }

            let imageFiles = [];
            for (const file of req.files) {
                const url = await uploadBufferToCloudinary(file.buffer, file.originalname);
                imageFiles.push(url);
            }


            patient.images = patient.images || [];
            patient.images.push(...imageFiles);
            await patient.save();


            const report = await Report.findOne({ patient: patientId, doctor: doctorId }).sort({ date: -1 });
            if (report) {
                report.images = report.images || [];
                report.images.push(...imageFiles);
                await report.save();
            }

            const submission = new PathologySubmission({
                patientId,
                doctorId,
                images: imageFiles,
                comment
            });

            const savedSubmission = await submission.save();
            const populatedSubmission = await PathologySubmission.findById(savedSubmission._id)
                .populate('patientId', 'name email')
                .populate('doctorId', 'name email');

            res.status(201).json(populatedSubmission);
        } catch (err) {
            console.error('Pathology submission error:', err);
            res.status(500).json({ message: 'Server error while creating submission', error: err.message });
        }
    },


    async getSubmissions(req, res) {
        try {
            const { patientId, doctorId } = req.query;
            const filter = {};
            if (patientId) filter.patientId = patientId;
            if (doctorId) filter.doctorId = doctorId;
            const submissions = await PathologySubmission.find(filter)
                .populate('patientId', 'name email')
                .populate('doctorId', 'name email');
            res.json(submissions);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    },


    async getSubmissionById(req, res) {
        try {
            const submission = await PathologySubmission.findById(req.params.id)
                .populate('patientId', 'name email')
                .populate('doctorId', 'name email');
            if (!submission) return res.status(404).json({ message: 'Not found' });
            res.json(submission);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
};

export default pathologySubmissionController;
