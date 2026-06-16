import { jsPDF } from 'jspdf';

/**
 * Generate a ticket PDF with the given data.
 * Uses only built-in Helvetica font to avoid external font loading issues.
 * Falls back gracefully on any error.
 */
export async function generateTicketPdf(data: {
  eventTitle: string;
  orderNumber: string;
  startDate?: string;
  endDate?: string;
  venueName?: string;
  venueCity?: string;
  ticketCount: number;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  seatLabels?: string[];
  qrDataUrl?: string;
  qrFallbackText?: string;
}): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [297, 150],
  });

  try {
    const pageHeight = 150;

    // Left section - gradient background
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, 210, pageHeight, 'F');

    // Right section - light background
    doc.setFillColor(249, 250, 251);
    doc.rect(210, 0, 87, pageHeight, 'F');

    // Use built-in Helvetica font (always available, no external file needed)
    doc.setFont('helvetica', 'bold');

    // Event title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    const title = data.eventTitle.length > 30 ? data.eventTitle.substring(0, 30) + '...' : data.eventTitle;
    doc.text(title, 15, 30);

    // Divider line
    doc.setDrawColor(255, 255, 255, 100);
    doc.setLineWidth(0.5);
    doc.line(15, 35, 200, 35);

    // Order info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Order: ' + data.orderNumber, 15, 45);

    // Date & Time
    doc.setFontSize(11);
    doc.text('Date: ' + formatDate(data.startDate), 15, 58);
    doc.text('Time: ' + formatTime(data.startDate), 15, 68);

    // Venue
    const venueText = (data.venueName || 'TBA') + (data.venueCity ? ', ' + data.venueCity : '');
    doc.text('Venue: ' + (venueText.length > 40 ? venueText.substring(0, 40) + '...' : venueText), 15, 78);

    // Tickets count
    doc.text('Tickets: ' + data.ticketCount, 15, 90);

    // Contact info
    if (data.contactName) {
      doc.setFontSize(9);
      doc.text('Name: ' + data.contactName, 15, 105);
    }
    if (data.contactEmail) {
      doc.text('Email: ' + data.contactEmail, 15, 113);
    }
    if (data.contactPhone) {
      doc.text('Phone: ' + data.contactPhone, 15, 121);
    }

    // Seats
    if (data.seatLabels && data.seatLabels.length > 0) {
      doc.text('Seats: ' + data.seatLabels.join(', '), 15, 132);
    }

    // Dashed border line between sections
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(210, 5, 210, pageHeight - 5);

    // QR Code on the right
    if (data.qrDataUrl) {
      try {
        doc.addImage(data.qrDataUrl, 'PNG', 230, 15, 50, 50);
      } catch {
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(data.qrFallbackText || data.orderNumber, 255, 40, { align: 'center' });
      }
    } else if (data.qrFallbackText) {
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(data.qrFallbackText, 255, 40, { align: 'center' });
    }

    // "Scan at Entry" text
    doc.setTextColor(17, 24, 39);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Scan at Entry', 255, 75, { align: 'center' });

    // Confirmed badge
    doc.setFillColor(220, 252, 231);
    doc.roundedRect(228, 82, 54, 8, 4, 4, 'F');
    doc.setTextColor(22, 101, 52);
    doc.setFontSize(8);
    doc.text('CONFIRMED', 255, 87.5, { align: 'center' });

    // EventFlow branding
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('EventFlow', 255, 105, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('eventflow.com', 255, 112, { align: 'center' });
  } catch (err) {
    console.error('PDF generation error:', err);
  }

  return doc;
}

/**
 * Download a jsPDF instance as a PDF file.
 * Uses manual blob + anchor approach for reliable cross-browser downloads.
 */
export function downloadPdf(doc: jsPDF, filename: string): void {
  try {
    const pdfBlob = doc.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } catch (err) {
    console.error('PDF download error:', err);
    throw err; // Re-throw so calling code can show toast
  }
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return 'TBD';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatTime(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '';
  }
}

export { formatDate, formatTime };