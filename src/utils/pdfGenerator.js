/**
 * PDF Generation Utilities
 * - Session Summary PDF
 * - Certificate PDF
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generate Session Summary PDF
 */
export const generateSessionPDF = async (sessionData, feedbacks, creatorName) => {
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 20;

  // Title
  doc.setFontSize(20);
  doc.text('Session Summary Report', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Session Details
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('Session Details:', 20, yPosition);
  yPosition += 8;

  doc.setFont(undefined, 'normal');
  doc.setFontSize(11);
  const sessionDetails = [
    `Title: ${sessionData.title}`,
    `Topic: ${sessionData.topic}`,
    `Mentor: ${creatorName}`,
    `Date & Time: ${new Date(sessionData.dateTime).toLocaleString()}`,
    `Location: ${sessionData.location}`,
    `Skill Level: ${sessionData.skillLevel}`
  ];

  sessionDetails.forEach(detail => {
    doc.text(detail, 20, yPosition);
    yPosition += 7;
  });

  yPosition += 5;

  // Attendees
  doc.setFont(undefined, 'bold');
  doc.setFontSize(12);
  doc.text('Attendees:', 20, yPosition);
  yPosition += 8;

  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  const attendees = sessionData.attendees || [];
  if (attendees.length > 0) {
    attendees.forEach((attendee, index) => {
      doc.text(`${index + 1}. ${attendee.studentName || 'Unknown'}`, 25, yPosition);
      yPosition += 6;
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 20;
      }
    });
  } else {
    doc.text('No attendees', 25, yPosition);
    yPosition += 6;
  }

  yPosition += 5;

  // Feedback Summary
  doc.setFont(undefined, 'bold');
  doc.setFontSize(12);
  doc.text('Feedback Summary:', 20, yPosition);
  yPosition += 8;

  if (feedbacks && feedbacks.length > 0) {
    const avgRating = (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(2);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(11);
    doc.text(`Average Rating: ${avgRating} / 5.0`, 20, yPosition);
    yPosition += 7;
    doc.text(`Total Feedbacks: ${feedbacks.length}`, 20, yPosition);
    yPosition += 12;

    doc.setFont(undefined, 'bold');
    doc.text('Individual Feedback:', 20, yPosition);
    yPosition += 8;

    feedbacks.forEach((feedback, index) => {
      doc.setFont(undefined, 'bold');
      doc.setFontSize(10);
      doc.text(`${index + 1}. ${feedback.studentName}`, 20, yPosition);
      yPosition += 6;

      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
      doc.text(`Rating: ${feedback.rating}/5 | Behavior: ${feedback.behavior}`, 25, yPosition);
      yPosition += 5;
      doc.text(`Learned: ${feedback.learned}`, 25, yPosition, { maxWidth: 160 });
      yPosition += 8;

      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 20;
      }
    });
  } else {
    doc.setFont(undefined, 'normal');
    doc.text('No feedback yet', 20, yPosition);
    yPosition += 6;
  }

  // Footer
  doc.setFontSize(9);
  doc.setTextColor(128, 128, 128);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, pageHeight - 10);

  // Save PDF
  doc.save(`session-summary-${sessionData.sessionId}.pdf`);
};

/**
 * Generate Certificate PDF
 */
export const generateCertificatePDF = (certificateData) => {
  try {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Background color (light cream)
    doc.setFillColor(255, 250, 240);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Border
    doc.setDrawColor(184, 134, 11);
    doc.setLineWidth(3);
    doc.rect(15, 15, pageWidth - 30, pageHeight - 30);

    // Inner decorative border
    doc.setDrawColor(218, 165, 32);
    doc.setLineWidth(1);
    doc.rect(20, 20, pageWidth - 40, pageHeight - 40);

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(32);
    doc.setTextColor(184, 134, 11);
    doc.text('Certificate of Achievement', pageWidth / 2, 50, { align: 'center' });

    // Subtitle
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    const subtitle = certificateData.certificateType === 'peer-mentor'
      ? 'Peer Mentor Certificate'
      : certificateData.certificateType === 'outstanding-helper'
      ? 'Outstanding Helper Certificate'
      : 'Completion Certificate';
    doc.text(subtitle, pageWidth / 2, 60, { align: 'center' });

    // This certifies that...
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('This certifies that', pageWidth / 2, 80, { align: 'center' });

    // Student Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(184, 134, 11);
    doc.text(certificateData.studentName || 'Student', pageWidth / 2, 100, { align: 'center' });

    // Achievement text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    const achievementText = certificateData.certificateType === 'peer-mentor'
      ? `has successfully taught the session: "${certificateData.sessionTitle}"`
      : certificateData.certificateType === 'outstanding-helper'
      ? `has demonstrated outstanding teaching excellence in: "${certificateData.sessionTitle}"`
      : `has successfully completed: "${certificateData.sessionTitle}"`;
    doc.text(achievementText, pageWidth / 2, 120, { align: 'center', maxWidth: 200 });

    // Session details
    doc.setFontSize(11);
    const issueDate = certificateData.issueDate || certificateData.issuedDate || new Date();
    doc.text(`Date: ${new Date(issueDate).toLocaleDateString()}`, pageWidth / 2, 140, { align: 'center' });
    
    // Rating if available
    if (certificateData.averageRating) {
      doc.text(`Average Rating: ${certificateData.averageRating.toFixed(1)}/5.0`, pageWidth / 2, 147, { align: 'center' });
    }

    // Campus name
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text('NavGurukul Campus - Peer Learning Program', pageWidth / 2, 160, { align: 'center' });

    // Signature line
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.line(30, 175, 70, 175);
    doc.setFontSize(9);
    doc.text('Program Coordinator', 50, 180, { align: 'center' });

    // Seal/Badge area
    doc.setFillColor(184, 134, 11);
    doc.circle(pageWidth - 40, 175, 15, 'F');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('✓', pageWidth - 40, 177, { align: 'center' });

    // Certificate ID
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    const certId = certificateData.certificateId || certificateData._id || 'N/A';
    doc.text(`Certificate ID: ${certId}`, 20, pageHeight - 10);

    // Save PDF
    const fileName = `certificate-${certificateData.certificateType}-${certId}.pdf`;
    doc.save(fileName);
    
    return true;
  } catch (error) {
    console.error('Error generating certificate PDF:', error);
    throw error;
  }
};

/**
 * Generate Certificate from HTML Element
 */
export const generateCertificateFromHTML = async (elementId, fileName) => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Element not found');
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#fffaf0'
    });

    const imgData = canvas.toDataURL('image/png');
    const doc = new jsPDF({
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgWidth = doc.internal.pageSize.getWidth();
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    doc.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    doc.save(fileName);
  } catch (error) {
    console.error('Error generating certificate from HTML:', error);
  }
};

export default {
  generateSessionPDF,
  generateCertificatePDF,
  generateCertificateFromHTML
};
