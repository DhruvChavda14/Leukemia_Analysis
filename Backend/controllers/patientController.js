import Patient from "../models/Patient.js";

export const getAllPatients = async (req, res) => {
    const patients = await Patient.find();
    res.json(patients);
};

export const getPatientById = async (req, res) => {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ error: "Patient not found" });
    res.json(patient);
};

export const createPatient = async (req, res) => {
    const { name, age, gender, email, address } = req.body;
    const patient = new Patient({ name, age, gender, email, address });
    await patient.save();
    res.status(201).json(patient);
};

export const updatePatient = async (req, res) => {
    const { name, age, gender } = req.body;
    const patient = await Patient.findByIdAndUpdate(
        req.params.id,
        { name, age, gender },
        { new: true }
    );
    if (!patient) return res.status(404).json({ error: "Patient not found" });
    res.json(patient);
};

export const deletePatient = async (req, res) => {
    const patient = await Patient.findByIdAndDelete(req.params.id);
    if (!patient) return res.status(404).json({ error: "Patient not found" });
    res.json({ message: "Patient deleted" });
};
