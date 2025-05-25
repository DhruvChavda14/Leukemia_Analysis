import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    type: { type: String, required: true }, // Type of medical test/examination
    date: { type: Date, default: Date.now },
    status: {
        type: String,
        enum: ['Pending', 'InProgress', 'Completed', 'Reviewed'],
        default: "Pending"
    },
    stage: { type: String },
    images: [String],

    aiAnalysis: {
        class: { type: String, required: true },
        confidence: { type: Number, required: true },
        saliencyImage: { type: String, required: true },
        gradcamImage: { type: String, required: true },
        doctorRemarks: { type: String, required: true }
    }
}, {
    timestamps: true
});

reportSchema.index({ patient: 1, doctor: 1, date: -1 });
reportSchema.index({ status: 1 });

reportSchema.methods.isAccessibleByDoctor = function (doctorId) {
    return this.doctor.toString() === doctorId.toString();
};

export default mongoose.model("Report", reportSchema);