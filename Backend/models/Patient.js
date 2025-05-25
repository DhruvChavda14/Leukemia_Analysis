import mongoose from "mongoose";
const patientSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    age: Number,
    gender: String,
    address: String,

    images: [{ type: String }],

    
    detectedDisease: { type: String, default: '' },
    reportStatus: { type: String, default: 'Pending' },


    reports: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Report' }]
});

export default mongoose.model("Patient", patientSchema);