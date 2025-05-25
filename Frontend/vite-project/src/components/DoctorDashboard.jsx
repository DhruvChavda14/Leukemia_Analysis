import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { Helmet } from "react-helmet-async";
import { Trash2 } from "lucide-react";
import {

    Users,

    Image as ImageIcon,

    Search,
    Microscope,

    Check
} from "lucide-react";

import SendReportModal from './SendReportModal';

export default function DoctorDashboard() {
    const [, navigate] = useLocation();
    const [patients, setPatients] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [selectedReport, setSelectedReport] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [analysisError, setAnalysisError] = useState(null);
    const [showReportGenerator, setShowReportGenerator] = useState(false);
    const [activeView, setActiveView] = useState("patients");
    const [showNotifications, setShowNotifications] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [showPreview, setShowPreview] = useState(false);
    const [showReportOptions, setShowReportOptions] = useState(false);
    const [savedReports, setSavedReports] = useState([]);
    const [showReportHistory, setShowReportHistory] = useState(false);
    const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
    const [plainTextReport, setPlainTextReport] = useState("");
    const [showPlainTextModal, setShowPlainTextModal] = useState(false);
    const [showSentConfirmation, setShowSentConfirmation] = useState(false);
    const reportContentRef = useRef(null);
    const printFrameRef = useRef(null);
    const [selectedImages, setSelectedImages] = useState([]);
    const [showSendReportModal, setShowSendReportModal] = useState(false);
    const [currentReportForSending, setCurrentReportForSending] = useState(null);
    const [aiPrediction, setAiPrediction] = useState(null);
    const [aiSaliencyUrl, setAiSaliencyUrl] = useState(null);
    const [aiGradcamUrl, setAiGradcamUrl] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState("");
    const [aiAnalyzedImage, setAiAnalyzedImage] = useState(null);
    const [doctorRemarks, setDoctorRemarks] = useState("");
    const [reportNotes, setReportNotes] = useState("");
    const [aiResultsByImage, setAiResultsByImage] = useState({});
    const [saveError, setSaveError] = useState("");
    const [saveSuccess, setSaveSuccess] = useState("");
    const [deleteError, setDeleteError] = useState("");
    const [deleteSuccess, setDeleteSuccess] = useState("");

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const doctorId = user._id || user.id;
    if (!doctorId) return;
    //console.log('DEBUG doctorId:', doctorId);
    const unreadNotificationsCount = notifications.filter(n => !n.read).length;
    const [deletePatientId, setDeletePatientId] = useState(null);

    const FLASK_URL = import.meta.env.VITE_FLASK_URL;

    useEffect(() => {
        if (!doctorId) return;


        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/${doctorId}/patients`, {
            headers: {}
        })
            .then(res => res.json())
            .then(async (patients) => {
                setPatients(patients);
            })
            .catch(console.error);
    }, [doctorId]);

    const handleNotificationClick = (notification) => {

        setNotifications(notifications.map(n =>
            n.id === notification.id ? { ...n, read: true } : n
        ));


        const patient = patients.find(p =>
            p.reports.some(r => r.id === notification.reportId)
        );

        if (patient) {
            setSelectedPatient(patient);
        }

        setShowNotifications(false);
    };

    const handleLogout = () => {
        navigate("/");
    };

    const handlePatientSelect = (patient) => {
        setSelectedPatient(patient);
    };

    const handleReportSelect = (report) => {

        if (report.status === 'Completed' && (report.diagnosis || report.stage)) {
            setAnalysisResult({
                result: report.result || '',
                confidence: report.confidence || 1,
                type: report.diagnosis || '',
                stage: report.stage || '',
                cellAbnormalities: report.cellAbnormalities || [],
                insights: report.doctorNotes || report.pathologistNotes || ''
            });
            setActiveView('report');
        } else {
            setAnalysisResult(null);
            setActiveView('images');
        }
        setShowReportGenerator(false);
    };

    const runAIAnalysis = async () => {
        setIsAnalyzing(true);
        setAnalysisError(null);

        try {

            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/reports/${selectedReport.id}/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ images: selectedReport.images })
            });
            if (!response.ok) throw new Error('AI analysis failed');
            const data = await response.json();
            console.log('AI analysis result:', data);

            const updatedReport = {
                ...selectedReport,
                predictedClass: data.predicted_class,
                status: 'AI Analyzed',
            };
            setSelectedReport(updatedReport);


            setPatients(patients => patients.map(p => {
                if (p.id === selectedPatient.id) {
                    return {
                        ...p,
                        reports: p.reports.map(r => r.id === selectedReport.id ? updatedReport : r)
                    };
                }
                return p;
            }));

            setAnalysisResult({
                result: data.predicted_class,
                confidence: 1,
                type: data.predicted_class,
                stage: '',
                cellAbnormalities: [],
                insights: ''
            });
            setActiveView('report');
        } catch (error) {
            console.error('AI analysis failed:', error);
            setAnalysisError('Failed to generate AI analysis. Please try again later.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const generateReport = () => {

        if (!selectedReport && Object.keys(aiResultsByImage).length > 0 && selectedPatient) {
            const analyzedImages = Object.keys(aiResultsByImage);
            const tempReport = {
                id: `TEMP-${Date.now()}`,
                patientId: selectedPatient.id,
                patientName: selectedPatient.name,
                date: new Date().toLocaleDateString(),
                images: analyzedImages,
                status: 'Draft',
                type: 'AI Analysis',
                diagnosis: '',
                stage: '',
                doctorNotes: '',
                predictedClass: aiResultsByImage[analyzedImages[0]]?.prediction?.class || 'Unknown',
                confidence: aiResultsByImage[analyzedImages[0]]?.prediction?.confidence || 0
            };
            setSelectedReport(tempReport);
        }
        setShowReportGenerator(true);

        if (analysisResult && analysisResult.insights) {
            setReportNotes(analysisResult.insights);
            setTimeout(() => {
                const textarea = document.getElementById('report-textarea');
                if (textarea) {
                    textarea.focus();
                    textarea.select();
                }
            }, 100);
        }
    };

    const editReport = () => {
        setShowReportGenerator(true);
        setActiveView("report");
    };


    const extractPlainText = (markdownText) => {
        return markdownText
            .replace(/\*\*(.*?)\*\*/g, '$1')  
            .replace(/\*(.*?)\*/g, '$1')      
            .replace(/## (.*?)(\n|$)/g, '$1') 
            .replace(/\* (.*?)(\n|$)/g, '$1') 
    };

    const sendReportToPatient = () => {

        const reportData = {
            id: `RPT-${Date.now()}`,
            patientId: selectedPatient.id,
            patientName: selectedPatient.name,
            date: new Date().toLocaleDateString(),
            content: reportNotes,
            plainContent: extractPlainText(reportNotes),
            diagnosis: analysisResult?.type || "Unknown",
            stage: analysisResult?.stage || "Unknown",
            images: selectedReport.images 
        };

        setCurrentReportForSending(reportData);
        setShowSendReportModal(true);
        setShowSaveConfirmation(false);
    };

    const saveReport = async () => {
        console.log("Save button clicked. Selected Patient:", selectedPatient, "Selected Report:", selectedReport);
        if (!selectedPatient || !selectedReport) {
            setSaveError("Missing patient or report. Please select both before saving.");
            return;
        }
        setSaveError("");



        let primaryAiData = null;
        let primaryAiImageFilename = null;

        if (selectedReport.images && selectedReport.images.length > 0) {
            for (const imgFilename of selectedReport.images) {
                if (aiResultsByImage[imgFilename]) {
                    primaryAiData = aiResultsByImage[imgFilename];
                    primaryAiImageFilename = imgFilename; 
                    break;
                }
            }
        }



        if (!primaryAiData && aiAnalyzedImage && aiResultsByImage[aiAnalyzedImage]) {
            primaryAiData = aiResultsByImage[aiAnalyzedImage];
            primaryAiImageFilename = aiAnalyzedImage;
        }





        const reportToSave = {
            patient: selectedPatient.id,
            doctor: doctorId,
            type: "AI Leukomia Analysis",
            status: "Completed",
            stage: primaryAiData?.prediction?.class || "Pending AI Review",
            images: selectedReport.images || [],


            aiAnalysis: {
                class: primaryAiData?.prediction?.class || "N/A",
                confidence: primaryAiData?.prediction?.confidence || 0,
                saliencyImage: primaryAiData?.saliencyUrl || "",
                gradcamImage: primaryAiData?.gradcamUrl || "",
                doctorRemarks: reportNotes || (primaryAiData ? "Review AI findings." : "No AI analysis performed or notes entered."),
            }
        };




        console.log("Report object being sent to backend:", reportToSave);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setSaveError("Authentication token not found. Please log in again.");
                return;
            }

            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/reports/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(reportToSave)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const savedReportByBackend = await response.json();
            console.log('Report saved successfully by backend:', savedReportByBackend);



            setPatients(prevPatients => prevPatients.map(p => {
                if (p.id === selectedPatient.id) {

                    const reportExists = p.reports?.some(r => r.id === selectedReport.id);
                    let updatedPReports;
                    if (reportExists) {
                        updatedPReports = (p.reports || []).map(r =>
                            r.id === selectedReport.id ? { ...r, ...savedReportByBackend.report, status: "Completed" } : r
                        );
                    } else {


                        updatedPReports = [...(p.reports || []), { ...savedReportByBackend.report, status: "Completed" }];
                    }
                    return { ...p, reports: updatedPReports };
                }
                return p;
            }));


            if (selectedReport.id.startsWith('TEMP-')) {
                setSelectedReport({ ...savedReportByBackend.report, status: "Completed" });
            } else {
                setSelectedReport(prev => ({ ...prev, ...savedReportByBackend.report, status: "Completed" }));
            }

            setSaveSuccess("Report saved successfully to backend!");
            setShowReportGenerator(false);
            setShowSaveConfirmation(true);
            setReportNotes("");

        } catch (error) {
            console.error('Failed to save report to backend:', error);
            setSaveError(error.message || 'Failed to save the report. Please try again.');
            setSaveSuccess("");
        }
    };


    const printReport = () => {
        if (!reportContentRef.current) return;


        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);


        const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>LeukemiaDetect Medical Report - ${selectedPatient.name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .patient-info { margin-bottom: 20px; padding: 10px; border-bottom: 1px solid #eee; }
            .content { line-height: 1.6; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; }
            h1 { color: #2563eb; }
            h2 { color: #2563eb; margin-top: 20px; margin-bottom: 10px; }
            @media print {
              @page { margin: 2cm; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>LeukemiaDetect</h1>
            <h2>Medical Report</h2>
          </div>
          <div class="patient-info">
            <p><strong>Patient:</strong> ${selectedPatient.name}</p>
            <p><strong>Patient ID:</strong> ${selectedPatient.id}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Report Generated By:</strong> Dr. Smith</p>
          </div>
          <div class="content">
            ${reportNotes
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/## (.*?)(\n|$)/g, '<h2>$1</h2>')
                .replace(/\* (.*?)(\n|$)/g, '<li>$1</li>')
                .replace(/\n/g, '<br />')}
          </div>
          <div class="footer">
            <p>This report was generated by LeukemiaDetect AI-assisted platform.</p>
            <p>© ${new Date().getFullYear()} LeukemiaDetect Medical Systems</p>
          </div>
        </body>
      </html>
    `;


        iframe.contentWindow.document.open();
        iframe.contentWindow.document.write(printContent);
        iframe.contentWindow.document.close();

        iframe.onload = () => {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();

            setTimeout(() => document.body.removeChild(iframe), 1000);
        };


        setShowReportOptions(false);
    };


    const viewReportHistory = () => {
        setShowReportHistory(true);
        setShowReportOptions(false);
    };

    const filteredPatients = searchQuery
        ? patients.filter(p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.id.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : patients;

    //console.log('Selected report images:', selectedReport && selectedReport.images);


    const handleAnalyzeImage = useCallback(async (imgFilename) => {
        setAiLoading(true);
        setAiError("");
        setAiPrediction(null);
        setAiSaliencyUrl(null);
        setAiGradcamUrl(null);
        setAiAnalyzedImage(imgFilename);
        try {
            const imageUrl = imgFilename.startsWith('http')
                ? imgFilename
                : `${import.meta.env.VITE_BACKEND_URL}/uploads/${imgFilename}`;
            const imageRes = await fetch(imageUrl);
            if (!imageRes.ok) throw new Error("Failed to fetch image from server.");
            const imageBlob = await imageRes.blob();
            let file;
            try {
                file = new File([imageBlob], imgFilename.split('/').pop() || 'image.jpg', { type: imageBlob.type });
            } catch {
                file = imageBlob;
            }
            const formData = new FormData();
            formData.append("image", file);
            const predictRes = await fetch(`${FLASK_URL}/predict`, {
                method: "POST",
                body: formData,
            });
            if (!predictRes.ok) throw new Error("Prediction failed.");
            const predictData = await predictRes.json();
            const { class: predictedClass, confidence, cloudinary_url } = predictData;
            const saliencyRes = await fetch(`${FLASK_URL}/saliency`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cloudinary_url }),
            });
            const gradcamRes = await fetch(`${FLASK_URL}/gradcam`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cloudinary_url }),
            });
            const saliencyData = await saliencyRes.json();
            const gradcamData = await gradcamRes.json();
            setAiResultsByImage(prev => ({
                ...prev,
                [imgFilename]: {
                    prediction: { class: predictedClass, confidence },
                    saliencyUrl: saliencyData.cloudinary_url,
                    gradcamUrl: gradcamData.cloudinary_url,
                    originalUrl: cloudinary_url,
                }
            }));
        } catch (err) {
            setAiError(err.message || "Something went wrong.");
        }
        setAiLoading(false);
    }, []);

    const imagesForAnalysis = selectedPatient?.images || [];

    const handlePatientRowClick = (patient) => {
        setSelectedPatient(patient);
        setActiveView("images");
    };

    const handleDeletePatientConfirm = async () => {
        if (!deletePatientId) return;
        setDeleteError("");
        setDeleteSuccess("");
        const token = localStorage.getItem('token');
        if (!token) {
            setDeleteError("Authentication token not found. Please log in again.");
            return;
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/patients/${deletePatientId}`, { // Adjusted endpoint based on typical REST patterns for users/patients
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                //  console.log(errorData);
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }


            setPatients(patients => patients.filter(p => p.id !== deletePatientId));
            if (selectedPatient && selectedPatient.id === deletePatientId) {
                setSelectedPatient(null);
                setActiveView("patients");
            }
            setDeleteSuccess("Patient and their reports deleted successfully.");
            setDeletePatientId(null);

            setTimeout(() => setDeleteSuccess(""), 3000);

        } catch (error) {
            console.error('Failed to delete patient:', error);
            setDeleteError(error.message || 'Failed to delete the patient. Please try again.');

            setTimeout(() => setDeleteError(""), 5000);
        }
    };

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            <Helmet>
                <title>Doctor Dashboard | Leukemia Detection Platform</title>
            </Helmet>
            <div className="flex flex-col h-screen bg-gray-100">
                {/* Top navigation bar */}
                <header className="bg-blue-700 text-white shadow-md">
                    <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                            <Microscope className="h-8 w-8" />
                            <h1 className="text-xl font-bold">LeukemiaDetect</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                                <span className="font-medium">{user.name ? user.name.split(' ').map(n => n[0]).join('') : 'DR'}</span>
                            </div>
                            <div className="hidden md:flex flex-col items-end">
                                <span className="font-semibold">{user.name || 'Doctor'}</span>
                                {user.age && <span className="text-xs text-blue-200">Age: {user.age}</span>}
                                {user.gender && <span className="text-xs text-blue-200">Gender: {user.gender}</span>}
                                {user.address && <span className="text-xs text-blue-200">{user.address}</span>}
                            </div>
                            <button
                                onClick={handleLogout}
                                className="bg-gray-800 text-white hover:bg-gray-700 px-3 py-1 rounded-md text-sm font-medium flex items-center gap-1 transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </header>

                {/* Main content */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar */}
                    <div className="w-20 md:w-64 bg-gray-900 text-white flex flex-col">
                        <div className="p-4 border-b border-gray-800">
                            <h2 className="hidden md:block text-lg font-semibold">Doctor Dashboard</h2>
                        </div>

                        <nav className="flex-1 overflow-y-auto py-4">
                            <ul className="space-y-1">
                                <li>
                                    <button
                                        onClick={() => {
                                            setActiveView("patients");
                                            setSelectedPatient(null);
                                        }}
                                        className={`w-full flex items-center space-x-3 px-4 py-3 ${activeView === "patients" ? "bg-blue-700" : "hover:bg-gray-800"
                                            }`}
                                    >
                                        <Users className="h-5 w-5 md:h-5 md:w-5" />
                                        <span className="hidden md:inline">Patients</span>
                                    </button>
                                </li>
                                {selectedPatient && (
                                    <li>
                                        <button
                                            onClick={() => setActiveView("images")}
                                            className={`w-full flex items-center space-x-3 px-4 py-3 ${activeView === "images" ? "bg-blue-700" : "hover:bg-gray-800"
                                                }`}
                                        >
                                            <ImageIcon className="h-5 w-5 md:h-5 md:w-5" />
                                            <span className="hidden md:inline">View Images</span>
                                        </button>
                                    </li>
                                )}
                            </ul>
                        </nav>

                        <div className="p-4 border-t border-gray-800">
                            <div className="hidden md:flex items-center space-x-2">
                                <div className="h-2 w-2 rounded-full bg-green-400"></div>
                                <span className="text-sm">AI Model Connected</span>
                            </div>
                        </div>
                    </div>

                    {/* Content area */}
                    <div className="flex-1 overflow-y-auto bg-gray-100">
                        <div className="container mx-auto p-6">
                            {activeView === "patients" && (
                                <div>
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-2xl font-bold text-gray-800">Patients</h2>
                                        <div className="relative w-64">
                                            <input
                                                type="text"
                                                placeholder="Search patients..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10"
                                            />
                                            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                        </div>
                                    </div>

                                    {/* Display delete success/error messages */}
                                    {deleteSuccess && (
                                        <div className="mb-4 p-3 bg-green-100 text-green-700 border border-green-400 rounded-md">
                                            {deleteSuccess}
                                        </div>
                                    )}
                                    {deleteError && (
                                        <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-400 rounded-md">
                                            {deleteError}
                                        </div>
                                    )}

                                    {/* Show patient info if any patients exist */}
                                    {patients.length > 0 ? (
                                        <div className="mb-6">
                                            <div className="text-lg font-semibold text-blue-700 mb-2">Assigned Patients</div>
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full bg-white rounded-lg shadow-md">
                                                    <thead>
                                                        <tr>
                                                            <th className="px-4 py-2 text-left">Name</th>
                                                            <th className="px-4 py-2 text-left">Email</th>
                                                            <th className="px-4 py-2 text-left">Age</th>
                                                            <th className="px-4 py-2 text-left">Gender</th>
                                                            <th className="px-4 py-2 text-left">Address</th>
                                                            <th className="px-4 py-2 text-left">Detected Disease</th>
                                                            <th className="px-4 py-2 text-left">Report Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {patients.map((p) => (
                                                            <tr key={p.id} className="border-b last:border-b-0">
                                                                <td className="px-4 py-2">{p.name}</td>
                                                                <td className="px-4 py-2">{p.email}</td>
                                                                <td className="px-4 py-2">{p.age}</td>
                                                                <td className="px-4 py-2">{p.gender}</td>
                                                                <td className="px-4 py-2">{p.address}</td>
                                                                <td className="px-4 py-2">{p.detectedDisease || '-'}</td>
                                                                <td className="px-4 py-2">{p.reportStatus || '-'}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mb-6 text-red-600 font-semibold">No patients assigned to you yet. </div>
                                    )}

                                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                        <div className="grid grid-cols-6 bg-gray-50 p-4 font-medium text-gray-600 border-b">
                                            <div className="col-span-2">Patient</div>
                                            <div className="col-span-1">Age / Gender</div>
                                            <div className="col-span-2">Recent Report</div>
                                            <div className="col-span-1">Status</div>
                                        </div>

                                        {filteredPatients.map((patient) => (
                                            <div
                                                key={patient.id}
                                                className="group grid grid-cols-6 p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer relative"
                                                onClick={() => handlePatientRowClick(patient)}
                                            >
                                                <div className="col-span-2 flex items-center">
                                                    <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-medium">
                                                        {patient.name.split(" ").map((n) => n[0]).join("")}
                                                    </div>
                                                    <div className="ml-3">
                                                        <div className="font-medium">{patient.name}</div>
                                                        <div className="text-sm text-gray-500">{patient.id}</div>
                                                    </div>
                                                </div>
                                                <div className="col-span-1 flex items-center">
                                                    {patient.age} / {patient.gender}
                                                </div>
                                                <div className="col-span-2 flex items-center">
                                                    {patient.reports && patient.reports[0] && patient.reports[0].type ? (
                                                        <div>
                                                            <div className="font-medium">{patient.reports[0].type}</div>
                                                            <div className="text-sm text-gray-500">{patient.reports[0].date || 'Date N/A'}</div>
                                                        </div>
                                                    ) : patient.detectedDisease && patient.detectedDisease !== '-' ? (
                                                        <div>
                                                            <div className="font-medium">Last Finding: {patient.detectedDisease}</div>
                                                            {patient.reportStatus && (
                                                                <div className="text-sm text-gray-500">Status: {patient.reportStatus}</div>
                                                            )}
                                                        </div>
                                                    ) : patient.reportStatus ? (
                                                        <div>
                                                            <div className="font-medium text-gray-500">Overall Status: {patient.reportStatus}</div>
                                                            {patient.reportStatus.toLowerCase() === 'pending' && <div className="text-sm text-gray-500">Details pending</div>}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400">No report details</span>
                                                    )}
                                                </div>
                                                <div className="col-span-1 flex items-center">
                                                    {patient.reportStatus ? (
                                                        <div>
                                                            <span
                                                                className={`text-sm px-2 py-1 rounded-full ${patient.reportStatus.toLowerCase() === "completed"
                                                                    ? "bg-green-100 text-green-800"
                                                                    : patient.reportStatus.toLowerCase() === "pending"
                                                                        ? "bg-yellow-100 text-yellow-800"
                                                                        : "bg-gray-100 text-gray-800"
                                                                    }`}
                                                            >
                                                                {patient.reportStatus}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </div>
                                                {/* Delete button, only visible on hover */}
                                                <button
                                                    type="button"
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 hover:bg-red-700 text-white rounded-full p-2 z-10"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDeletePatientId(patient.id);
                                                    }}
                                                    title="Delete patient"
                                                >
                                                    <Trash2 className="h-5 w-5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeView === "images" && selectedPatient && selectedPatient.images && selectedPatient.images.length > 0 && (
                                <div className="image-gallery mb-6 flex flex-wrap gap-4">
                                    {selectedPatient.images.map((img, idx) => (
                                        <div key={idx} className="flex flex-col items-center">
                                            {aiResultsByImage[img] ? (
                                                <img
                                                    src={img && img.startsWith('http') ? img : `${import.meta.env.VITE_BACKEND_URL}/uploads/${img}`}
                                                    alt={`Blood Sample ${idx + 1}`}
                                                    width={180}
                                                    className="rounded border mb-2"
                                                />
                                            ) : (
                                                <img
                                                    src={img && img.startsWith('http') ? img : `${import.meta.env.VITE_BACKEND_URL}/uploads/${img}`}
                                                    alt={`Blood Sample ${idx + 1}`}
                                                    width={180}
                                                    className="rounded border mb-2"
                                                />
                                            )}
                                            {!aiResultsByImage[img] && (
                                                <button
                                                    onClick={() => handleAnalyzeImage(img)}
                                                    disabled={aiLoading && aiAnalyzedImage === img}
                                                    className="px-4 py-2 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 mb-2"
                                                >
                                                    {(aiLoading && aiAnalyzedImage === img) ? "Analyzing..." : "Run Leukemia AI Analysis"}
                                                </button>
                                            )}
                                            {aiResultsByImage[img] && (
                                                <div className="w-full mt-2">
                                                    <h4 className="font-semibold text-gray-700 mb-1">Prediction</h4>
                                                    <p><b>Class:</b> {aiResultsByImage[img].prediction.class}<br /><b>Confidence:</b> {(aiResultsByImage[img].prediction.confidence * 100).toFixed(2)}%</p>
                                                    <h4 className="font-semibold text-gray-700 mb-1 mt-2">Saliency Map</h4>
                                                    <img src={aiResultsByImage[img].saliencyUrl} alt="Saliency Map" width={180} className="rounded border" />
                                                    <h4 className="font-semibold text-gray-700 mb-1 mt-2">Grad-CAM Map</h4>
                                                    <img src={aiResultsByImage[img].gradcamUrl} alt="Grad-CAM Map" width={180} className="rounded border" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeView === "images" && selectedPatient && selectedReport && (
                                <div>
                                    <div className="flex items-center mb-6">
                                        <button
                                            onClick={() => setActiveView("patients")}
                                            className="mr-2 text-blue-600 hover:text-blue-800"
                                        >
                                            Patients
                                        </button>
                                        <span className="text-gray-500 mx-2">/</span>
                                        <h2 className="text-2xl font-bold text-gray-800">{selectedPatient.name}</h2>
                                        <span className="text-gray-500 mx-2">/</span>
                                        <span className="text-gray-600">{selectedReport.date} Report</span>
                                    </div>

                                    <div className="mb-8">
                                        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                                            <h3 className="text-xl font-semibold mb-4">AI Leukemia Analysis</h3>
                                            <div className="flex flex-wrap gap-8">
                                                {imagesForAnalysis.length > 0 ? (
                                                    imagesForAnalysis.map((img, idx) => (
                                                        <div key={img} className="flex flex-col items-center">
                                                            {aiResultsByImage[img] ? (
                                                                <img
                                                                    src={img && img.startsWith('http') ? img : `${import.meta.env.VITE_BACKEND_URL}/uploads/${img}`}
                                                                    alt={`Blood Sample ${idx + 1}`}
                                                                    width={180}
                                                                    className="rounded border mb-2"
                                                                />
                                                            ) : (
                                                                <img
                                                                    src={img && img.startsWith('http') ? img : `${import.meta.env.VITE_BACKEND_URL}/uploads/${img}`}
                                                                    alt={`Blood Sample ${idx + 1}`}
                                                                    width={180}
                                                                    className="rounded border mb-2"
                                                                />
                                                            )}
                                                            {!aiResultsByImage[img] && (
                                                                <button
                                                                    onClick={() => handleAnalyzeImage(img)}
                                                                    disabled={aiLoading && aiAnalyzedImage === img}
                                                                    className="px-4 py-2 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 mb-2"
                                                                >
                                                                    {(aiLoading && aiAnalyzedImage === img) ? "Analyzing..." : "Run Leukemia AI Analysis"}
                                                                </button>
                                                            )}
                                                            {aiResultsByImage[img] && (
                                                                <div className="w-full mt-2">
                                                                    <h4 className="font-semibold text-gray-700 mb-1">Prediction</h4>
                                                                    <p><b>Class:</b> {aiResultsByImage[img].prediction.class}<br /><b>Confidence:</b> {(aiResultsByImage[img].prediction.confidence * 100).toFixed(2)}%</p>
                                                                    <h4 className="font-semibold text-gray-700 mb-1 mt-2">Saliency Map</h4>
                                                                    <img src={aiResultsByImage[img].saliencyUrl} alt="Saliency Map" width={180} className="rounded border" />
                                                                    <h4 className="font-semibold text-gray-700 mb-1 mt-2">Grad-CAM Map</h4>
                                                                    <img src={aiResultsByImage[img].gradcamUrl} alt="Grad-CAM Map" width={180} className="rounded border" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-gray-500">No images available for analysis.</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-lg shadow-md p-6">
                                        <div className="flex justify-between items-center mb-6">
                                            <div>
                                                <h3 className="text-xl font-semibold">{selectedReport.type}</h3>
                                                <p className="text-gray-500">
                                                    Uploaded on {selectedReport.date} • Status:
                                                    <span className={`ml-1 ${selectedReport.status === 'Completed'
                                                        ? 'text-green-600'
                                                        : 'text-yellow-600'
                                                        }`}>
                                                        {selectedReport.status}
                                                    </span>
                                                </p>
                                            </div>
                                            {/* Only show Run AI Analysis button if analysisResult is NOT set */}
                                            {selectedReport.status !== 'Completed' && !analysisResult && (
                                                <button
                                                    onClick={runAIAnalysis}
                                                    disabled={isAnalyzing}
                                                    className={`px-4 py-2 rounded-md bg-blue-600 text-white font-medium ${isAnalyzing ? 'opacity-75 cursor-not-allowed' : 'hover:bg-blue-700'}`}
                                                >
                                                    {isAnalyzing ? 'Analyzing...' : 'Run AI Analysis'}
                                                </button>
                                            )}
                                        </div>

                                        {/* Image gallery */}
                                        {selectedReport && selectedReport.images && selectedReport.images.length > 0 && (
                                            <div className="image-gallery mb-6 flex flex-wrap gap-4">
                                                {selectedReport.images.map((img, idx) => (
                                                    <div key={idx} className="flex flex-col items-center">
                                                        {aiResultsByImage[img] ? (
                                                            <img
                                                                src={img && img.startsWith('http') ? img : `${import.meta.env.VITE_BACKEND_URL}/uploads/${img}`}
                                                                alt={`Blood Sample ${idx + 1}`}
                                                                style={{ maxWidth: 300, borderRadius: 8, boxShadow: '0 2px 8px #0001' }}
                                                            />
                                                        ) : (
                                                            <img
                                                                src={img && img.startsWith('http') ? img : `${import.meta.env.VITE_BACKEND_URL}/uploads/${img}`}
                                                                alt={`Blood Sample ${idx + 1}`}
                                                                style={{ maxWidth: 300, borderRadius: 8, boxShadow: '0 2px 8px #0001' }}
                                                            />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Diagnosis summary (if completed) */}
                                        {selectedReport.status === 'Completed' && (
                                            <div className="p-4 bg-green-50 rounded-lg">
                                                <h4 className="font-semibold text-green-800 mb-2">Diagnosis Summary</h4>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-sm text-gray-600">Diagnosis</p>
                                                        <p className="font-medium">{selectedReport.diagnosis}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-600">Stage</p>
                                                        <p className="font-medium">{selectedReport.stage}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* AI predicted class */}
                                        {selectedReport && analysisResult && (
                                            <>
                                                {selectedReport.predictedClass && (
                                                    <div className="p-4 bg-yellow-50 rounded-lg mb-6">
                                                        <h4 className="font-semibold text-yellow-800 mb-2">AI Predicted Class</h4>
                                                        <p className="text-gray-700 text-lg">{selectedReport.predictedClass}</p>
                                                    </div>
                                                )}
                                                {/* Only show Generate Report button if analysisResult is set and report editor is not open */}
                                                {selectedReport && analysisResult && !showReportGenerator && (
                                                    <button
                                                        className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                                                        onClick={generateReport}
                                                    >
                                                        Generate Report
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showReportGenerator && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-8 relative">
                        <h2 className="text-xl font-bold mb-4">Generate Medical Report</h2>
                        {saveError && (
                            <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{saveError}</div>
                        )}
                        <textarea
                            id="report-textarea"
                            className="w-full h-40 border rounded p-2 mb-4"
                            value={reportNotes}
                            onChange={e => setReportNotes(e.target.value)}
                            placeholder="Enter your report notes here..."
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                                onClick={() => setShowReportGenerator(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                onClick={saveReport}
                            >
                                Save Report
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Show Generate Report button globally if at least one image has been analyzed */}
            {Object.keys(aiResultsByImage).length > 0 && !showReportGenerator && (
                <button
                    className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    onClick={generateReport}
                >
                    Generate Report
                </button>
            )}

            {showSaveConfirmation && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                        <div className="flex items-center justify-center mb-4">
                            <div className="bg-green-500 rounded-full p-3">
                                <Check className="h-6 w-6 text-white" />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-center mb-2 text-gray-900">Report Saved</h3>
                        <p className="text-center text-gray-600 mb-4">
                            Your report has been saved successfully.
                        </p>
                        <div className="flex justify-center">
                            <button
                                onClick={() => setShowSaveConfirmation(false)}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showSendReportModal && currentReportForSending && (
                <SendReportModal
                    isOpen={showSendReportModal}
                    onClose={() => setShowSendReportModal(false)}
                    reportData={currentReportForSending}
                    patient={selectedPatient}
                />
            )}
        </div>
    );
}