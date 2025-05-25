import express from "express";
import {
    getAllReports,
    getReportById,
    createReport,
    updateReport,
    deleteReport,
    getDoctorReports,
    getPatientReports,
    saveReport
} from "../controllers/reportController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import upload from "../middleware/multerUpload.js";
const router = express.Router();

router.get("/", authMiddleware, getAllReports);
router.get("/:id", authMiddleware, getReportById);
router.post("/", authMiddleware, upload.array('images', 10), createReport);
router.put("/:id", authMiddleware, updateReport);
router.delete("/:id", authMiddleware, deleteReport);


router.get("/doctor/reports", authMiddleware, getDoctorReports);
router.get("/patient/:patientId/reports", authMiddleware, getPatientReports);


router.post("/save", authMiddleware, saveReport);

export default router;
