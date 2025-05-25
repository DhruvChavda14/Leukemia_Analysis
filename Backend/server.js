import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

import authRoutes from "./routes/auth.js";
import patientRoutes from "./routes/patients.js";
import reportRoutes from "./routes/reports.js";


import pathologySubmissionRoutes from "./routes/pathologySubmissions.js";
import usersRoutes from "./routes/users.js";

dotenv.config();
connectDB();

const app = express();
app.use(cors({
    origin: '*',
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/pathology-submissions", pathologySubmissionRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/users", usersRoutes);

app.get("/", (req, res) => res.send("Backend API Running"));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
