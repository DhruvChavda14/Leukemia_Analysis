import Report from "../models/Report.js";
import Doctor from "../models/Doctor.js";
import Pathologist from "../models/Pathologist.js";
import Patient from "../models/Patient.js";

export const getAllReports = async (req, res) => {
    try {
        console.log("Fetching all reports...");
        const reports = await Report.find()
            .populate("patient", "name email reports")
            .populate("doctor", "name email");
        console.log("tched successfully:", reports);
        res.json(reports);
    } catch (error) {
        console.error("Error fetching reports:", error);
        res.status(500).json({ error: error.message });
    }
};

export const getReportById = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id)
            .populate("patient", "name email")
            .populate("doctor", "name email");
        if (!report) return res.status(404).json({ error: "Report not found" });
        res.json(report);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createReport = async (req, res) => {
    try {
        const { patientEmail, doctorEmail, type, diagnosis, stage, pathologistNotes } = req.body;


        const patient = await Patient.findOne({ email: patientEmail });
        const doctor = await Doctor.findOne({ email: doctorEmail });

        if (!patient || !doctor) {
            return res.status(404).json({
                error: !patient ? "Patient not found" : "Doctor not found"
            });
        }


        let imageFiles = [];
        if (req.files && req.files.length > 0) {
            imageFiles = req.files.map(f => f.filename);
        } else {
            return res.status(400).json({ error: "At least one image file is required." });
        }

        const report = new Report({
            patient: patient._id,
            doctor: doctor._id,
            patientId: patient._id,
            doctorId: doctor._id,
            type,
            date: new Date(),
            status: "Pending",
            diagnosis,
            stage,
            images: imageFiles,
            doctorNotes: req.body.doctorNotes || ""

        });

        await report.save();


        await Notification.create({
            user: doctor._id,
            patient: patient._id,
            doctor: doctor._id,
            type: "NEW_REPORT",
            message: `New report uploaded for patient ${patient.name}`
        });

        res.status(201).json(report);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


export const getDoctorReports = async (req, res) => {
    try {
        const reports = await Report.find({ doctor: req.user._id })
            .populate("patient", "name email")
            .populate("pathologist", "name email")
            .sort("-date");
        res.json(reports);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


export const getPatientReports = async (req, res) => {
    try {
        console.log(`Fetching reports for patient ID: ${req.params.patientId}`);
        const reports = await Report.find({ patient: req.params.patientId })
            .populate("doctor", "name email")
            .select("-__v")
            .sort("-date");
        console.log(`Fetched reports successfully for patient ${req.params.patientId}:`, reports);
        res.json(reports);
    } catch (error) {
        console.error(`Error fetching reports for patient ${req.params.patientId}:`, error);
        res.status(500).json({ error: error.message });
    }
};

export const updateReport = async (req, res) => {
    try {
        const { type, diagnosis, stage, doctorNotes, status } = req.body;
        const report = await Report.findByIdAndUpdate(
            req.params.id,
            { type, diagnosis, stage, doctorNotes, status },
            { new: true }
        ).populate("patient doctor pathologist");

        if (!report) return res.status(404).json({ error: "Report not found" });


        if (status && status !== report.status) {
            await Notification.create({
                user: report.patient,
                patient: report.patient,
                doctor: report.doctor,
                type: "REPORT_STATUS_CHANGE",
                message: `Your report status has been updated to ${status}`
            });
        }

        res.json(report);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteReport = async (req, res) => {
    try {
        const report = await Report.findByIdAndDelete(req.params.id);
        if (!report) return res.status(404).json({ error: "Report not found" });
        res.json({ message: "Report deleted" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


export const analyzeReport = async (req, res) => {
    try {
        const reportId = req.params.id;
        const { predicted_class } = req.body;
        const report = await Report.findById(reportId);
        if (!report) return res.status(404).json({ error: 'Report not found' });

        report.status = 'AI Analyzed';
        report.doctorAnalysis = report.doctorAnalysis || {};
        report.doctorAnalysis.diagnosis = predicted_class;
        await report.save();

        const patient = await Patient.findById(report.patient);
        if (patient) {
            patient.detectedDisease = predicted_class;
            patient.reportStatus = 'AI Analyzed';
            await patient.save();
        }
        res.json({ predicted_class });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const saveReport = async (req, res) => {
    try {
        const { patient: patientId, doctor, type, status, stage, images, aiAnalysis } = req.body;


        console.log("Incoming report data:", {
            patient: patientId,
            doctor,
            type,
            status,
            stage,
            images,
            aiAnalysis
        });


        if (!patientId || !doctor || !type || !status || !images) {
            console.error("Missing basic required fields in request body for report");
            return res.status(400).json({ message: "Missing required fields (patient, doctor, type, status, images are mandatory)" });
        }

        if (aiAnalysis && (!aiAnalysis.class || aiAnalysis.confidence === undefined || !aiAnalysis.saliencyImage || !aiAnalysis.gradcamImage || !aiAnalysis.doctorRemarks)) {
            console.error("Missing required fields within aiAnalysis object");
            return res.status(400).json({ message: "Missing required fields within aiAnalysis object (class, confidence, saliencyImage, gradcamImage, doctorRemarks)" });
        }


        const newReport = new Report({
            patient: patientId,
            doctor,
            type,
            status,
            stage,
            images,
            aiAnalysis
        });


        const savedReport = await newReport.save();


        const patientDoc = await Patient.findById(patientId);
        if (!patientDoc) {
            console.error(`Patient with ID ${patientId} not found after saving report ${savedReport._id}. Report saved, but not linked/patient status not updated.`);

        } else {
            patientDoc.reports.push(savedReport._id);


            patientDoc.reportStatus = savedReport.status;
            if (savedReport.aiAnalysis && savedReport.aiAnalysis.class) {
                patientDoc.detectedDisease = savedReport.aiAnalysis.class;
            } else if (savedReport.stage) {
                patientDoc.detectedDisease = savedReport.stage;
            }

            await patientDoc.save();
            console.log(`Report ${savedReport._id} added to patient ${patientId}, and patient status/disease updated.`);
        }

        console.log("Report saved successfully and linked to patient:", savedReport);
        res.status(201).json({ message: 'Report saved successfully and linked to patient', report: savedReport });
    } catch (error) {
        console.error('Error saving report and updating patient:', error);
        res.status(500).json({ message: 'Failed to save report and update patient', error: error.message });
    }
};
