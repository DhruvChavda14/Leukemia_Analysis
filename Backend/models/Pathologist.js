import mongoose from "mongoose";
const pathologistSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    age: Number,
    gender: String,
    address: String
});
export default mongoose.model("Pathologist", pathologistSchema); 