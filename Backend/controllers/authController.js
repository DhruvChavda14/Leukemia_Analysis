import Doctor from "../models/Doctor.js";
import Pathologist from "../models/Pathologist.js";
import Patient from "../models/Patient.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
    const { name, email, password, role, age, gender, address } = req.body;
    try {
        if (!name || !email || !password || !role || !age || !gender || !address) {
            return res.status(400).json({ error: "All fields are required" });
        }
        const hashed = await bcrypt.hash(password, 10);
        let user;
        if (role === "doctor") {
            user = new Doctor({ name, email, password: hashed, age, gender, address });
        } else if (role === "pathologist") {
            user = new Pathologist({ name, email, password: hashed, age, gender, address });
        } else if (role === "patient") {

            user = new Patient({ name, email, age, gender, address });
        } else {
            return res.status(400).json({ error: "Invalid role" });
        }
        //console.log(user);
        await user.save();
        res.json({ message: "User registered" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

export const login = async (req, res) => {
    const { email, password, role } = req.body;
    let user;
    if (role === "doctor") {
        user = await Doctor.findOne({ email });
    } else if (role === "pathologist") {
        user = await Pathologist.findOne({ email });
    } else if (role === "patient") {
        user = await Patient.findOne({ email });
    }
    if (!user) return res.status(400).json({ error: "Invalid credentials" });
    //console.log(user);
    if (role !== "patient") {
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user._id, role }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.json({ token, user: { id: user._id, name: user.name, role, age: user.age, gender: user.gender, address: user.address, email: user.email } });
};
