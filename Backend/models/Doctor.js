import mongoose from "mongoose";
const doctorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    age: Number,
    gender: String,
    address: String,
    patients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Patient' }]
});
export default mongoose.model("Doctor", doctorSchema); 