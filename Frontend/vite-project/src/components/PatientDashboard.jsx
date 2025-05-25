import React, { useState, useEffect } from "react";
import { Microscope, FileText, User, LogOut, Image as ImageIcon, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { Helmet } from "react-helmet";

export default function PatientDashboard() {
    const [reports, setReports] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);
    const [loadingError, setLoadingError] = useState(null);
    //console.log(reports);
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const patientId = user.id || user._id;

    useEffect(() => {
        if (!patientId) {
            setLoadingError("Patient ID not found. Cannot fetch reports.");
            return;
        }
        const token = localStorage.getItem('token');
        if (!token) {
            setLoadingError("Authentication token not found. Please log in again.");
            return;
        }

        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/reports/patient/${patientId}/reports`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => {
                if (!res.ok) {
                    throw new Error(`Failed to fetch reports: ${res.status} ${res.statusText}`);
                }
                return res.json();
            })
            .then(data => {
                if (Array.isArray(data)) {
                    const sortedReports = data.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
                    setReports(sortedReports);
                    setLoadingError(null);
                } else {
                    console.error("Unexpected data format for reports:", data);
                    setReports([]);
                    setLoadingError("Received unexpected data format for reports.");
                }
            })
            .catch(error => {
                console.error("Error fetching reports:", error);
                setReports([]);
                setLoadingError(error.message || "An unknown error occurred while fetching reports.");
            });
    }, [patientId]);

    function handleLogout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = "/";
    }

    const headerBg = "bg-blue-700";
    const mainContentBg = selectedReport ? "bg-gray-800" : "bg-gray-900";
    const cardBg = "bg-gray-800";
    const textColor = "text-gray-100";
    const highlightColor = "text-blue-400";

    return (
        <div className={`min-h-screen flex flex-col ${mainContentBg} transition-colors duration-300`}>
            <Helmet>
                <title>{user.name ? `${user.name}'s Dashboard` : "Patient Dashboard"} | LeukemiaDetect</title>
            </Helmet>
            <header className={`${headerBg} text-white shadow-md sticky top-0 z-50`}>
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <Microscope className="h-8 w-8" />
                        <h1 className="text-xl sm:text-2xl font-bold">LeukemiaDetect</h1>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="hidden sm:flex flex-col items-end">
                            <span className="font-semibold">{user.name || "Patient"}</span>
                            <span className="text-xs text-blue-200">{user.email}</span>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center ring-2 ring-white">
                            <User className="h-5 w-5" />
                        </div>
                        <button
                            onClick={handleLogout}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors"
                        >
                            <LogOut className="w-4 h-4" /> Logout
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 w-full py-8 px-4 sm:px-6 lg:px-8">
                <div className="w-full max-w-5xl mx-auto">
                    {loadingError && (
                        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md flex items-center gap-3">
                            <AlertCircle className="h-5 w-5" />
                            <span>Error loading reports: {loadingError}</span>
                        </div>
                    )}

                    {!selectedReport && (
                        <>
                            <h2 className={`text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 ${textColor} flex items-center gap-3`}>
                                <FileText className={highlightColor} /> Your Medical Reports
                            </h2>
                            {reports.length > 0 ? (
                                <div className="space-y-4 sm:space-y-5">
                                    {reports.map((report) => (
                                        <button
                                            key={report._id || report.id}
                                            onClick={() => setSelectedReport(report)}
                                            className={`w-full ${cardBg} hover:bg-gray-700 transition-all duration-200 ease-in-out rounded-lg px-6 py-5 shadow-lg text-left flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75`}
                                        >
                                            <div>
                                                <h3 className={`text-lg sm:text-xl font-semibold ${highlightColor} mb-1`}>{report.type || "Medical Report"}</h3>
                                                <p className={`text-sm ${textColor} opacity-80`}>Date: {new Date(report.date || report.createdAt).toLocaleDateString()}</p>
                                            </div>
                                            <span className={`text-sm font-medium px-3 py-1 rounded-full ${report.status === 'Completed' || report.status === 'Reviewed' ? 'bg-green-600 text-white' :
                                                report.status === 'Pending' || report.status === 'InProgress' ? 'bg-yellow-500 text-gray-900' :
                                                    'bg-gray-600 text-white'
                                                }`}>
                                                Status: {report.status}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                !loadingError && <p className={`${textColor} opacity-75`}>You have no reports available at the moment.</p>
                            )}
                        </>
                    )}

                    {selectedReport && (
                        <div className={`${cardBg} p-6 sm:p-8 rounded-lg shadow-2xl ${textColor}`}>
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 border-b border-gray-700">
                                <div>
                                    <h3 className={`text-2xl sm:text-3xl font-bold ${highlightColor} mb-1`}>{selectedReport.type || "Medical Report"}</h3>
                                    <p className="text-sm opacity-80">Date: {new Date(selectedReport.date || selectedReport.createdAt).toLocaleDateString()}</p>
                                    <p className="text-sm opacity-80">Status: <span className="font-semibold">{selectedReport.status}</span></p>
                                    {selectedReport.stage && <p className="text-sm opacity-80">Stage/Classification: <span className="font-semibold">{selectedReport.stage}</span></p>}
                                </div>
                                <button
                                    onClick={() => setSelectedReport(null)}
                                    className={`mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors`}
                                >
                                    &larr; Back to Reports
                                </button>
                            </div>

                            {selectedReport.aiAnalysis ? (
                                <div className="mb-6">
                                    <h4 className="text-xl font-semibold mb-3 border-b border-gray-700 pb-2">AI Analysis Summary</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                        <p><strong>Predicted Class:</strong> {selectedReport.aiAnalysis.class || "N/A"}</p>
                                        <p><strong>Confidence:</strong> {(selectedReport.aiAnalysis.confidence * 100).toFixed(2) || "0.00"}%</p>
                                        <p className="md:col-span-2"><strong>Doctor's Remarks/Notes:</strong> {selectedReport.aiAnalysis.doctorRemarks || "No remarks provided."}</p>
                                    </div>
                                    {(selectedReport.aiAnalysis.saliencyImage || selectedReport.aiAnalysis.gradcamImage) && (
                                        <div className="mt-6">
                                            <h5 className="text-lg font-medium mb-3">AI Heatmaps</h5>
                                            <div className="flex flex-wrap gap-6">
                                                {selectedReport.aiAnalysis.saliencyImage && (
                                                    <div className="text-center">
                                                        <p className="text-sm font-medium mb-1">Saliency Map</p>
                                                        <img src={selectedReport.aiAnalysis.saliencyImage} alt="Saliency Map" className="rounded-md border border-gray-600 max-w-xs mx-auto shadow-md" style={{ maxWidth: '200px' }} />
                                                    </div>
                                                )}
                                                {selectedReport.aiAnalysis.gradcamImage && (
                                                    <div className="text-center">
                                                        <p className="text-sm font-medium mb-1">Grad-CAM</p>
                                                        <img src={selectedReport.aiAnalysis.gradcamImage} alt="Grad-CAM" className="rounded-md border border-gray-600 max-w-xs mx-auto shadow-md" style={{ maxWidth: '200px' }} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="p-4 bg-yellow-100 text-yellow-800 rounded-md flex items-center gap-3 mb-6">
                                    <AlertCircle className="h-5 w-5" />
                                    <span>No AI analysis data available for this report.</span>
                                </div>
                            )}

                            {selectedReport.images && selectedReport.images.length > 0 && (
                                <div className="mt-6 pt-6 border-t border-gray-700">
                                    <h4 className="text-xl font-semibold mb-4">Associated Images</h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                        {selectedReport.images.map((imgUrl, index) => (
                                            <div key={index} className="aspect-w-1 aspect-h-1">
                                                <img
                                                    src={imgUrl.startsWith('http') ? imgUrl : `${import.meta.env.VITE_BACKEND_URL}/uploads/${imgUrl}`}
                                                    alt={`Report Image ${index + 1}`}
                                                    className="object-cover w-full h-full rounded-md border border-gray-600 shadow-md"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}