import jsPDF from "jspdf";
import logoUrl from "../assets/logo.png";

/**
 * Generate a landscape ID card PDF for a member (front and back design)
 * Front: Logo + FitSync header, Photo, Name and ID details
 * Back: QR code on left, Name and ID on right
 * @param {Object} member - Member object with photo_url, memberId, fullName, etc.
 */
export async function generateMemberIDPDF(member) {
  try {
    if (!member?.memberId || !member?.fullName) {
      throw new Error("Member ID and name are required");
    }

    // Create landscape PDF - standard credit card size scaled up (210mm x 100mm)
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: [210, 100],
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // =====================
    // FRONT PAGE - Logo Only
    // =====================
    
    // Add green background
    pdf.setFillColor(126, 186, 86); // Green #7eba56
    pdf.rect(0, 0, pageWidth, pageHeight, "F");

    // Add white content area with padding
    const padding = 8;
    pdf.setFillColor(255, 255, 255);
    pdf.rect(padding, padding, pageWidth - 2 * padding, pageHeight - 2 * padding, "F");

    // Add border
    pdf.setDrawColor(126, 186, 86);
    pdf.setLineWidth(1);
    pdf.rect(padding, padding, pageWidth - 2 * padding, pageHeight - 2 * padding);

    // Center logo on front page
    const logoSize = 50;
    const logoX = (pageWidth - logoSize) / 2;
    const logoY = (pageHeight - logoSize) / 2;
    const logoImage = await loadImageAsDataURL(logoUrl);
    if (logoImage) {
      pdf.addImage(logoImage, "PNG", logoX, logoY, logoSize, logoSize);
    }

    // =====================
    // BACK PAGE - QR Code on Left, Name/ID on Right (Modern Design)
    // =====================
    
    pdf.addPage([210, 100], "landscape");

    // Add green background on back
    pdf.setFillColor(126, 186, 86);
    pdf.rect(0, 0, pageWidth, pageHeight, "F");

    // Add white content area (no border for modern look)
    pdf.setFillColor(255, 255, 255);
    pdf.rect(padding, padding, pageWidth - 2 * padding, pageHeight - 2 * padding, "F");

    // LEFT SECTION - QR Code
    const qrSize = 70;
    const qrX = padding + 16;
    const qrY = (pageHeight - qrSize) / 2;

    const qrCanvas = await generateQRCodeCanvas(member.memberId, qrSize * 3.78); // Convert mm to px
    if (qrCanvas) {
      const qrImage = qrCanvas.toDataURL("image/png");
      pdf.addImage(qrImage, "PNG", qrX, qrY, qrSize, qrSize);
    }

    // Add text below QR
    const qrTextY = qrY + qrSize + 3;
    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    pdf.setFont(undefined, "normal");
    pdf.text("Scan to Verify", qrX + qrSize / 2, qrTextY, { align: "center" });

    // RIGHT SECTION - Member Details on green background (modern gradient-like effect)
    const detailsX = qrX + qrSize + 18;
    const detailsWidth = pageWidth - detailsX - padding - 8;

    // Add green banner for details
    pdf.setFillColor(126, 186, 86);
    pdf.rect(detailsX - 3, padding, detailsWidth + 6, pageHeight - 2 * padding, "F");

    // Add member name on back - Much larger and bold
    const backNameY = padding + 18;
    pdf.setFontSize(28);
    pdf.setTextColor(255, 255, 255);
    pdf.setFont(undefined, "bold");
    pdf.text(`${member.fullName}`, detailsX + 4, backNameY, { maxWidth: detailsWidth - 8 });

    // Add "ID:" label and member ID on back - Larger
    const backIdY = backNameY + 18;
    pdf.setFontSize(20);
    pdf.setFont(undefined, "normal");
    pdf.text(`ID: ${member.memberId}`, detailsX + 4, backIdY, { maxWidth: detailsWidth - 8 });

    // Trigger download with only memberID as filename
    const filename = `${member.memberId}.pdf`;
    pdf.save(filename);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error generating member ID PDF:", error);
    throw error;
  }
}

/**
 * Generate QR code as canvas
 * @param {string} data - Data to encode in QR code
 * @param {number} size - Size of QR code in pixels
 * @returns {Promise<HTMLCanvasElement|null>}
 */
function generateQRCodeCanvas(data, size) {
  return new Promise((resolve) => {
    const tempContainer = document.createElement("div");
    tempContainer.style.display = "none";
    document.body.appendChild(tempContainer);

    // Load QR library if not already loaded
    if (!window.QRCode) {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
      script.async = true;
      script.onload = () => {
        // eslint-disable-next-line no-undef
        new QRCode(tempContainer, {
          text: data,
          width: size,
          height: size,
          colorDark: "#000000",
          colorLight: "#ffffff",
        });

        setTimeout(() => {
          const canvas = tempContainer.querySelector("canvas");
          document.body.removeChild(tempContainer);
          resolve(canvas);
        }, 100);
      };
      document.head.appendChild(script);
    } else {
      // eslint-disable-next-line no-undef
      new QRCode(tempContainer, {
        text: data,
        width: size,
        height: size,
        colorDark: "#000000",
        colorLight: "#ffffff",
      });

      setTimeout(() => {
        const canvas = tempContainer.querySelector("canvas");
        document.body.removeChild(tempContainer);
        resolve(canvas);
      }, 100);
    }
  });
}

/**
 * Load an image URL as a base64 data URL so jsPDF can embed it reliably.
 * @param {string} url
 * @returns {Promise<string|null>}
 */
async function loadImageAsDataURL(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();

    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn("Failed to load logo for PDF", error);
    return null;
  }
}

