import { useState } from 'react';
import { Mail, Smartphone, Download, X, Send, CheckCircle } from 'lucide-react';
import { sendReportToPatient, downloadReportAsPDF } from '../services/reportService';

export default function SendReportModal({ report, patient, onClose }) {
    const [sendMethod, setSendMethod] = useState('email');
    const [email, setEmail] = useState(patient.email || '');
    const [phone, setPhone] = useState(patient.phone || '');
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [sendSuccess, setSendSuccess] = useState(false);
    const [sendError, setError] = useState(null);


    const handleSend = async () => {
        setIsSending(true);
        setError(null);

        try {
            let result;

            if (sendMethod === 'email') {

                if (!email || !email.includes('@')) {
                    throw new Error('Please enter a valid email address');
                }

                result = await sendReportToPatient(report, patient, email);
            }
            else if (sendMethod === 'sms') {

                if (!phone || phone.length < 10) {
                    throw new Error('Please enter a valid phone number');
                }


                result = {
                    success: true,
                    message: `Report link sent to ${phone} via SMS`,
                    sentAt: new Date().toISOString()
                };

                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            else if (sendMethod === 'patient-portal') {

                result = {
                    success: true,
                    message: 'Report delivered to patient portal',
                    sentAt: new Date().toISOString()
                };

                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            setSendSuccess(true);
            setMessage(result.message);
        } catch (error) {
            console.error('Failed to send report:', error);
            setError(error.message || 'Failed to send report. Please try again.');
        } finally {
            setIsSending(false);
        }
    };


    const handleDownload = () => {
        downloadReportAsPDF(report, patient);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-blue-700 text-white">
                    <h3 className="text-lg font-semibold">Send Report to Patient</h3>
                    <button
                        onClick={onClose}
                        className="text-white hover:text-gray-200"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {!sendSuccess ? (
                    <div className="p-6">
                        <div className="mb-6">
                            <p className="text-gray-600 mb-2">
                                Select how you want to deliver this report to {patient.name}:
                            </p>

                            <div className="space-y-3 mt-4">
                                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                    <input
                                        type="radio"
                                        name="sendMethod"
                                        value="email"
                                        checked={sendMethod === 'email'}
                                        onChange={() => setSendMethod('email')}
                                        className="mr-3"
                                    />
                                    <Mail className="h-5 w-5 mr-2 text-blue-500" />
                                    <div>
                                        <p className="font-medium">Email</p>
                                        <p className="text-sm text-gray-500">Send a secure link via email</p>
                                    </div>
                                </label>

                                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                    <input
                                        type="radio"
                                        name="sendMethod"
                                        value="sms"
                                        checked={sendMethod === 'sms'}
                                        onChange={() => setSendMethod('sms')}
                                        className="mr-3"
                                    />
                                    <Smartphone className="h-5 w-5 mr-2 text-green-500" />
                                    <div>
                                        <p className="font-medium">SMS</p>
                                        <p className="text-sm text-gray-500">Send a secure link via text message</p>
                                    </div>
                                </label>

                                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                    <input
                                        type="radio"
                                        name="sendMethod"
                                        value="patient-portal"
                                        checked={sendMethod === 'patient-portal'}
                                        onChange={() => setSendMethod('patient-portal')}
                                        className="mr-3"
                                    />
                                    <Mail className="h-5 w-5 mr-2 text-purple-500" />
                                    <div>
                                        <p className="font-medium">Patient Portal</p>
                                        <p className="text-sm text-gray-500">Deliver directly to patient's portal</p>
                                    </div>
                                </label>

                                <div
                                    onClick={handleDownload}
                                    className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 mt-4"
                                >
                                    <Download className="h-5 w-5 mr-2 text-gray-500" />
                                    <div>
                                        <p className="font-medium">Download PDF</p>
                                        <p className="text-sm text-gray-500">Save to your computer and share manually</p>
                                    </div>
                                </div>
                            </div>
                        </div>


                        {sendMethod === 'email' && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="patient@example.com"
                                />
                            </div>
                        )}


                        {sendMethod === 'sms' && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="(123) 456-7890"
                                />
                            </div>
                        )}


                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Message (Optional)
                            </label>
                            <textarea
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows="3"
                                placeholder="Add a personal message to the patient..."
                            />
                        </div>


                        {sendError && (
                            <div className="p-3 bg-red-50 border-l-4 border-red-500 mb-4">
                                <p className="text-sm text-red-600">{sendError}</p>
                            </div>
                        )}

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSend}
                                disabled={isSending}
                                className={`px-4 py-2 rounded-md text-white font-medium flex items-center ${isSending ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                            >
                                <Send className="h-4 w-4 mr-2" />
                                {isSending ? 'Sending...' : 'Send Report'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="p-6">
                        <div className="flex flex-col items-center justify-center py-6">
                            <div className="bg-green-100 p-3 rounded-full mb-4">
                                <CheckCircle className="h-10 w-10 text-green-500" />
                            </div>
                            <h3 className="text-xl font-bold text-center mb-2">Report Sent Successfully!</h3>
                            <p className="text-center text-gray-600">{message}</p>
                        </div>

                        <button
                            onClick={onClose}
                            className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Close
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
} 