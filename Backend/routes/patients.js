import express from "express";
import {
    getAllPatients,
    getPatientById,
    createPatient,
    updatePatient,
    deletePatient
} from "../controllers/patientController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { saveReport } from "../controllers/reportController.js";
const router = express.Router();


router.get("/", authMiddleware, async (req, res) => {
    if (req.query.email) {
        const patient = await (await import("../models/Patient.js")).default.findOne({ email: req.query.email });
        if (!patient) return res.status(404).json({ error: "Patient not found" });
        return res.json([patient]);
    }
    const patients = await (await import("../models/Patient.js")).default.find();
    //console.log(patients);
    res.json(patients);
});


router.get("/search", authMiddleware, async (req, res) => {
    const { query } = req.query;
    if (!query) return res.json([]);
    const regex = new RegExp(query, "i");
    const patients = await (await import("../models/Patient.js")).default.find({
        $or: [
            { name: regex },
            { email: regex }
        ]
    }).select("name email age gender address");
    //console.log(patients);
    res.json(patients);
});
router.post("/", authMiddleware, createPatient);
router.get("/:id", authMiddleware, getPatientById);
router.put("/:id", authMiddleware, updatePatient);
router.delete("/:id", authMiddleware, deletePatient);

router.get("/assigned", authMiddleware, async (req, res) => {
    try {
        const doctorId = req.user.id;
        const Report = (await import("../models/Report.js")).default;
        const Patient = (await import("../models/Patient.js")).default;
        const reports = await Report.find({ doctor: doctorId }).select("patient");
        const patientIds = [...new Set(reports.map(r => r.patient.toString()))];
        const patients = await Patient.find({ _id: { $in: patientIds } });
        //console.log(patients);
        res.json(patients);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/saveReport", authMiddleware, saveReport);

export default router;
