import mongoose from 'mongoose';

const PathologySubmissionSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true
    },
    images: [{
        type: String, // Store file path or filename only
        required: true
    }],
    comment: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

const PathologySubmission = mongoose.model('PathologySubmission', PathologySubmissionSchema);
export default PathologySubmission;
