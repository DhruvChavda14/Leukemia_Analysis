import React, { useRef, useState, useEffect } from "react";
import { UploadCloud, Send, Microscope, X, Check } from "lucide-react";
import { useLocation } from "wouter";



export default function PathologistDashboard() {
    const [, navigate] = useLocation();
    const [step, setStep] = useState(1);
    const [patientName, setPatientName] = useState("");
    const [patientEmail, setPatientEmail] = useState("");
    const [doctorEmail, setDoctorEmail] = useState("");
    const [patientInfo, setPatientInfo] = useState(null);
    const [patientError, setPatientError] = useState("");
    const [images, setImages] = useState([]);
    const [comment, setComment] = useState("");
    const [dragActive, setDragActive] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [records, setRecords] = useState([]);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [showRecordModal, setShowRecordModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editIndex, setEditIndex] = useState(null);
    const inputRef = useRef();

    useEffect(() => {
        const token = localStorage.getItem('token');
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/reports`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(setRecords)
            .catch(console.error);
    }, []);

    async function fetchPatientByEmail(email) {
        setPatientError("");
        setPatientInfo(null);
        if (!email) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/patients?email=${encodeURIComponent(email)}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Patient not found");
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) setPatientInfo(data[0]);
            else if (data && data.email) setPatientInfo(data);
            else throw new Error("Patient not found");
        } catch (err) {
            setPatientError("No patient found with this email.");
        }
    }

    function handleDrag(e) {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
        else if (e.type === "dragleave") setDragActive(false);
    }

    function handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const files = Array.from(e.dataTransfer.files);
            //console.log(files);
            handleAddImages(files);
        }
    }

    function handleChange(e) {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            handleAddImages(files);
        }
    }

    function handleAddImages(files) {
        const newImages = files.map(file => ({
            name: file.name,
            file,
            url: URL.createObjectURL(file)
        }));
        setImages(prev => [...prev, ...newImages]);
    }

    function handleRemoveImage(idx) {
        setImages(prev => prev.filter((_, i) => i !== idx));
    }

    function handleCommentChange(e) {
        setComment(e.target.value);
    }

    function handlePatientInfoSubmit(e) {
        e.preventDefault();
        if (patientName && patientEmail) setStep(2);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!patientInfo) {
            console.error("Patient information is required");
            return;
        }
        const token = localStorage.getItem('token');

        const patientRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/patients?email=${encodeURIComponent(patientEmail)}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        let patient = await patientRes.json();
        if (Array.isArray(patient) && patient.length > 0) patient = patient[0];
        if (!patient || !patient._id) {

            const createPatientRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/patients`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    name: patientName,
                    email: patientEmail
                })
            });
            //console.log(createPatientRes);
            patient = await createPatientRes.json();
        }

        const doctorRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users?email=${encodeURIComponent(doctorEmail)}&role=doctor`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const doctor = await doctorRes.json();
        if (!doctor || !doctor._id) {
            console.error("Doctor not found");
            return;
        }


        const formData = new FormData();
        formData.append('patientId', patient._id);
        formData.append('doctorId', doctor._id);
        formData.append('comment', comment);
        images.forEach(img => {
            formData.append('images', img.file);
        });
        //console.log(formData);
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/pathology-submissions`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Submission failed:', errorText);
                throw new Error(`Submission failed: ${response.status} ${response.statusText}`);
            }

            const newSubmission = await response.json();


            setShowSuccess(true);
            setImages([]);
            setComment("");
            setPatientName("");
            setPatientEmail("");
            setDoctorEmail("");
            setStep(1);
            setEditMode(false);
            setEditIndex(null);
        } catch (error) {
            console.error('Error submitting pathology report:', error);
            alert('Failed to submit report. Please try again.');
        }
    }

    function handleLogout() {
        navigate("/");
    }

    function handleSelectRecent(patient, idx) {
        setSelectedRecord(patient);
        setShowRecordModal(true);
        setEditIndex(idx);
    }


    function handleChangeFromModal() {
        setPatientName(selectedRecord.name);
        setPatientEmail(selectedRecord.email);
        setComment(selectedRecord.comment);
        setImages(
            (selectedRecord.previewImages || []).map(img => ({
                name: img.name,
                url: img.url,
            }))
        );
        setStep(2);
        setShowRecordModal(false);
        setEditMode(true);

    }


    useEffect(() => {
        if (patientInfo && patientInfo.name) {
            setPatientName(patientInfo.name);
        }
    }, [patientInfo]);

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    return (
        <div className="min-h-screen bg-[#181c24] flex flex-col">

            <header className="bg-blue-700 text-white shadow-md">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        <Microscope className="h-8 w-8" />
                        <h1 className="text-xl font-bold">LeukemiaDetect</h1>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                            <span className="font-medium">{user.name ? user.name.split(' ').map(n => n[0]).join('') : 'PA'}</span>
                        </div>
                        <div className="hidden md:flex flex-col items-end">
                            <span className="font-semibold">{user.name || 'Pathologist'}</span>
                            {user.age && <span className="text-xs text-blue-200">Age: {user.age}</span>}
                            {user.gender && <span className="text-xs text-blue-200">Gender: {user.gender}</span>}
                            {user.address && <span className="text-xs text-blue-200">{user.address}</span>}
                        </div>
                        <button
                            onClick={handleLogout}
                            className="bg-gray-800 text-white hover:bg-gray-700 px-3 py-1 rounded-md text-sm font-medium transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>


            <main className="flex-1 flex flex-col items-center py-10">
                <div className="bg-[#23283a] shadow-xl rounded-xl w-full max-w-2xl p-8 border border-[#23283a]">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-white">
                        <UploadCloud className="text-blue-400" /> Pathologist Portal
                    </h2>


                    {step === 1 && (
                        <form onSubmit={e => {
                            e.preventDefault();
                            if (patientInfo) setStep(2);
                        }} className="space-y-6">
                            <div>
                                <label className="block text-lg font-semibold mb-2 text-gray-200">
                                    Patient Email
                                </label>
                                <input
                                    className="w-full p-3 border border-gray-700 rounded-lg bg-[#181c24] text-gray-100"
                                    placeholder="Enter patient email..."
                                    value={patientEmail}
                                    onChange={e => {
                                        setPatientEmail(e.target.value);
                                        setPatientInfo(null);
                                        setPatientError("");
                                    }}
                                    onBlur={e => fetchPatientByEmail(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') fetchPatientByEmail(e.target.value); }}
                                    type="email"
                                    required
                                    autoComplete="off"
                                />
                                {patientError && <div className="text-red-400 text-sm mt-2">{patientError}</div>}
                                {patientInfo && (
                                    <div className="mt-2 text-blue-200 text-sm border border-blue-700 rounded p-3 bg-[#23283a]">
                                        <div><b>Name:</b> {patientInfo.name}</div>
                                        <div><b>Email:</b> {patientInfo.email}</div>
                                        <div><b>Age:</b> {patientInfo.age}</div>
                                        <div><b>Gender:</b> {patientInfo.gender}</div>
                                        {patientInfo.address && <div><b>Address:</b> {patientInfo.address}</div>}
                                    </div>
                                )}
                            </div>
                            <button
                                type="submit"
                                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg shadow transition w-full mt-4"
                                disabled={!patientInfo}
                            >
                                Next: Upload Images
                            </button>
                        </form>
                    )}


                    {step === 2 && (
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="mb-2">
                                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-2">
                                    <div className="flex-1">
                                        <label className="block text-gray-300 font-semibold mb-1">Patient Name</label>
                                        <input
                                            className="w-full p-2 border border-gray-700 rounded-lg bg-[#181c24] text-gray-100"
                                            value={patientName}
                                            onChange={e => setPatientName(e.target.value)}
                                            required
                                            readOnly
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-gray-300 font-semibold mb-1">Patient Email</label>
                                        <input
                                            className="w-full p-2 border border-gray-700 rounded-lg bg-[#181c24] text-gray-100"
                                            value={patientEmail}
                                            onChange={e => setPatientEmail(e.target.value)}
                                            type="email"
                                            required
                                            readOnly
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-gray-300 font-semibold mb-1">Doctor Email</label>
                                        <input
                                            className="w-full p-2 border border-gray-700 rounded-lg bg-[#181c24] text-gray-100"
                                            value={doctorEmail}
                                            onChange={e => setDoctorEmail(e.target.value)}
                                            type="email"
                                            required
                                            placeholder="Enter doctor email"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        className="md:ml-auto text-blue-400 underline text-sm"
                                        onClick={() => {
                                            setStep(1);
                                            setEditMode(false);
                                            setEditIndex(null);
                                        }}
                                    >
                                        Change Patient
                                    </button>
                                </div>
                            </div>

                            <div
                                className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center transition-colors cursor-pointer ${dragActive
                                    ? "border-blue-500 bg-[#23283a]"
                                    : "border-gray-700 bg-[#23283a]"
                                    }`}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                onClick={() => inputRef.current.click()}
                            >
                                <input
                                    ref={inputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    onChange={handleChange}
                                />
                                {images.length > 0 ? (
                                    <div className="flex flex-wrap gap-4 justify-center">
                                        {images.map((img, idx) => (
                                            <div key={idx} className="relative group">
                                                <img
                                                    src={img.url && img.url.startsWith('http') ? img.url : (img.url ? `${import.meta.env.VITE_BACKEND_URL}/uploads/${img.url}` : URL.createObjectURL(img.file || img))}
                                                    alt={`Preview ${idx + 1}`}
                                                    className="w-36 h-36 object-cover rounded-xl border-2 border-blue-700 shadow-lg transition-transform hover:scale-105"
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 opacity-80 hover:opacity-100"
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        handleRemoveImage(idx);
                                                    }}
                                                    title="Remove"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                                <span className="block text-xs text-gray-400 mt-1 text-center max-w-[8rem] truncate">{img.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <UploadCloud className="w-12 h-12 text-blue-400 mb-2" />
                                        <p className="text-gray-300 font-medium">
                                            Drag & drop your pathology images here, or <span className="text-blue-400 underline">browse</span>
                                        </p>
                                        <p className="text-gray-500 text-xs mt-1">PNG, JPG, JPEG up to 10MB each</p>
                                    </div>
                                )}
                            </div>


                            <div>
                                <label className="block text-lg font-semibold mb-2 text-gray-200">
                                    Comments for Doctor
                                </label>
                                <textarea
                                    className="w-full min-h-[100px] p-3 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none bg-[#181c24] text-gray-100 text-base transition"
                                    placeholder="Write your observations, notes, or questions for the doctor here..."
                                    value={comment}
                                    onChange={handleCommentChange}
                                    required
                                />
                            </div>


                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg shadow transition"
                                    disabled={images.length === 0 || !comment}
                                >
                                    <Send className="w-5 h-5" /> {editMode ? "Update Submission" : "Submit to Doctor"}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </main>


            {showSuccess && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-gray-900 text-white rounded-lg shadow-xl w-96 overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-center justify-center mb-4">
                                <div className="bg-green-500 rounded-full p-3">
                                    <Check className="h-6 w-6 text-white" />
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-center mb-2">Submission Successful</h3>
                            <p className="text-center text-gray-300 mb-4">
                                Images and comments for patient <span className="font-semibold">{patientName || "N/A"}</span> have been submitted to the doctor.
                            </p>
                            <div className="flex justify-center mt-6">
                                <button
                                    onClick={() => setShowSuccess(false)}
                                    className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-6 rounded-md"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {showRecordModal && selectedRecord && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-gray-900 text-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold">Past Submission</h3>
                                <button
                                    onClick={() => setShowRecordModal(false)}
                                    className="text-gray-400 hover:text-white text-2xl font-bold"
                                    title="Close"
                                >
                                    &times;
                                </button>
                            </div>
                            <div className="mb-4">
                                <div className="font-semibold text-gray-200 mb-1">
                                    {selectedRecord.name} <span className="text-gray-400">({selectedRecord.email})</span>
                                </div>
                                <div className="text-xs text-gray-400 mb-2">{selectedRecord.date}</div>
                                <div className="mb-3">
                                    <div className="font-semibold text-gray-300 mb-1">Images:</div>
                                    <div className="flex flex-wrap gap-4">
                                        {(selectedRecord.previewImages || []).map((img, idx) => (
                                            <div key={idx} className="flex flex-col items-center">
                                                <img
                                                    src={img.url && img.url.startsWith('http') ? img.url : (img.url ? `${import.meta.env.VITE_BACKEND_URL}/uploads/${img.url}` : URL.createObjectURL(img.file || img))}
                                                    alt={img.name}
                                                    className="w-36 h-36 object-cover rounded-xl border-2 border-blue-700 shadow-lg"
                                                />
                                                <span className="text-xs text-gray-400 mt-1 max-w-[8rem] truncate">{img.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-300 mb-1">Comments:</div>
                                    <div className="bg-[#23283a] border border-gray-700 rounded p-3 text-gray-100 whitespace-pre-line">
                                        {selectedRecord.comment}
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    onClick={handleChangeFromModal}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-semibold"
                                >
                                    Change
                                </button>
                                <button
                                    onClick={() => setShowRecordModal(false)}
                                    className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}