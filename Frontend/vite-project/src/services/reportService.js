import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';


const REPORTS_DB = {
    reports: [],
    nextId: 1
};


export const saveReport = async (report) => {

    const newReport = {
        id: `RPT-${Date.now()}`,
        createdAt: new Date().toISOString(),
        ...report
    };


    REPORTS_DB.reports.push(newReport);
    REPORTS_DB.nextId++;

    console.log("Report saved:", newReport);
    return newReport;
};


export const getPatientReports = (patientId) => {
    return REPORTS_DB.reports.filter(r => r.patientId === patientId);
};


export const generateReportPDF = (report, patient, images = []) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);


    let yPosition = 20;
    let currentPage = 1;


    const checkForNewPage = (requiredSpace = 20) => {
        if (yPosition + requiredSpace > pageHeight - margin) {
            doc.addPage();
            currentPage++;
            yPosition = margin;
            return true;
        }
        return false;
    };


    doc.setFontSize(20);
    doc.setTextColor(0, 51, 153);
    doc.text("LeukemiaDetect Medical Report", margin, yPosition);
    yPosition += 15;


    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Patient: ${patient.name}`, margin, yPosition);
    yPosition += 10;
    doc.text(`Patient ID: ${patient.id}`, margin, yPosition);
    yPosition += 10;
    doc.text(`Date: ${new Date().toLocaleDateString()}`, margin, yPosition);
    yPosition += 10;
    doc.text(`Report ID: ${report.id}`, margin, yPosition);
    yPosition += 20;

    checkForNewPage();


    doc.setFontSize(16);
    doc.setTextColor(0, 51, 153);
    doc.text("Diagnosis", margin, yPosition);
    yPosition += 10;
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Type: ${report.diagnosis || "Not specified"}`, margin, yPosition);
    yPosition += 10;
    doc.text(`Stage: ${report.stage || "Not specified"}`, margin, yPosition);
    yPosition += 20;

    checkForNewPage();


    let cleanContent = report.content;


    const boldSegments = [];
    let processedContent = '';
    let lastIndex = 0;
    const boldRegex = /\*\*(.*?)\*\*/g;
    let match;

    while ((match = boldRegex.exec(cleanContent)) !== null) {

        processedContent += cleanContent.substring(lastIndex, match.index);


        const markerIndex = boldSegments.length;
        processedContent += `___BOLD_${markerIndex}___`;


        boldSegments.push(match[1]);


        lastIndex = match.index + match[0].length;
    }


    processedContent += cleanContent.substring(lastIndex);


    processedContent = processedContent
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/## (.*?)(\n|$)/g, '$1')
        .replace(/\* (.*?)(\n|$)/g, '- $1');


    doc.setFontSize(14);
    doc.setTextColor(0, 51, 153);
    doc.text("Medical Analysis", margin, yPosition);
    yPosition += 15;


    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    const lineHeight = 7;
    const boldLineHeight = 10;
    const splitContent = doc.splitTextToSize(processedContent, contentWidth);


    for (let i = 0; i < splitContent.length; i++) {
        let currentLine = splitContent[i];
        let isBoldLine = false;


        const boldMarkerRegex = /___BOLD_(\d+)___/g;
        let boldMarkersInLine = [];
        let boldMatch;


        while ((boldMatch = boldMarkerRegex.exec(currentLine)) !== null) {
            boldMarkersInLine.push({
                fullMatch: boldMatch[0],
                index: parseInt(boldMatch[1], 10),
            });
            isBoldLine = true;
        }

        if (isBoldLine) {

            if (yPosition > margin + lineHeight) {
                yPosition += 8;
            }


            if (yPosition + boldLineHeight + 8 > pageHeight - margin) {
                doc.addPage();
                currentPage++;
                yPosition = margin;
            }


            for (const marker of boldMarkersInLine) {
                currentLine = currentLine.replace(
                    marker.fullMatch,
                    boldSegments[marker.index]
                );
            }


            doc.setFontSize(13);
            doc.setTextColor(0, 0, 0);
            doc.setFont(undefined, 'bold');
            doc.text(currentLine, margin, yPosition);


            yPosition += boldLineHeight;


            doc.setFontSize(12);
            doc.setFont(undefined, 'normal');
        } else {

            if (yPosition + lineHeight > pageHeight - margin) {
                doc.addPage();
                currentPage++;
                yPosition = margin;
            }


            doc.text(currentLine, margin, yPosition);
            yPosition += lineHeight;
        }
    }


    yPosition += 15;


    if (images && images.length > 0) {

        doc.addPage();
        currentPage++;
        yPosition = margin;

        doc.setFontSize(14);
        doc.setTextColor(0, 51, 153);
        doc.text("Blood Sample Images", margin, yPosition);
        yPosition += 15;

        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);

        const imageHeight = 80;
        const metadataHeight = 30;
        const imageSpacing = 15;

        images.forEach((image, index) => {
            const requiredSpace = imageHeight + metadataHeight + imageSpacing;
            if (yPosition + requiredSpace > pageHeight - margin) {
                doc.addPage();
                currentPage++;
                yPosition = margin;
            }

            doc.setDrawColor(200, 200, 200);
            doc.setFillColor(240, 240, 240);
            doc.rect(margin, yPosition, 150, imageHeight, 'FD');
            doc.setFontSize(10);
            doc.text(`[Image ${index + 1}: ${image.metadata?.originalName || "Blood Sample"}]`, margin + 35, yPosition + 40);

            yPosition += imageHeight + 5;

            if (image.metadata) {
                doc.setFontSize(10);
                doc.text(`Magnification: ${image.metadata.magnification || 'N/A'}`, margin, yPosition);
                yPosition += 7;
                doc.text(`Stain Type: ${image.metadata.stainType || 'N/A'}`, margin, yPosition);
                yPosition += 7;
                doc.text(`Uploaded: ${new Date(image.uploadedAt).toLocaleDateString()}`, margin, yPosition);
                yPosition += imageSpacing;
            } else {
                yPosition += 10;
            }
        });
    }

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text(`LeukemiaDetect Medical Report - Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        doc.text(`Generated: ${new Date().toLocaleString()}`, margin, pageHeight - 10);
    }

    return doc;
};


export const sendReportToPatient = async (report, patient, emailAddress) => {

    console.log(`Sending report ${report.id} to patient ${patient.id} at ${emailAddress}`);


    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
        success: true,
        message: `Report sent to ${emailAddress}`,
        sentAt: new Date().toISOString()
    };
};


export const downloadReportAsPDF = (report, patient) => {

    const images = report.images || [];
    const doc = generateReportPDF(report, patient, images);
    const pdfBlob = doc.output('blob');
    saveAs(pdfBlob, `Medical_Report_${patient.name.replace(/\s+/g, '_')}_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`);
};


export const saveReportToBackend = async (reportData) => {
    try {
        console.log("Sending report data to backend:", reportData);
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/patients/saveReport`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify(reportData),
        });

        if (!response.ok) {
            const errorDetails = await response.json();
            console.error("Error response from backend:", errorDetails);
            throw new Error(`Error: ${response.statusText}`);
        }

        const result = await response.json();
        console.log("Report successfully saved to backend:", result);
        return result;
    } catch (error) {
        console.error("Error saving report to backend:", error);
        throw error;
    }
};