import jsPDF from "jspdf";
import logoUrl from "../assets/logo.png";

async function buildMemberIDPDF(member) {
  if (!member?.memberId || !member?.fullName) {
    throw new Error("Member ID and name are required");
  }

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [210, 100],
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const padding = 8;

  // =====================
  // FRONT PAGE - Logo Only
  // =====================
  pdf.setFillColor(126, 186, 86);
  pdf.rect(0, 0, pageWidth, pageHeight, "F");

  pdf.setFillColor(255, 255, 255);
  pdf.rect(padding, padding, pageWidth - 2 * padding, pageHeight - 2 * padding, "F");

  pdf.setDrawColor(126, 186, 86);
  pdf.setLineWidth(1);
  pdf.rect(padding, padding, pageWidth - 2 * padding, pageHeight - 2 * padding);

  const logoSize = 50;
  const logoX = (pageWidth - logoSize) / 2;
  const logoY = (pageHeight - logoSize) / 2;
  const logoImage = await loadImageAsDataURL(logoUrl);
  if (logoImage) {
    pdf.addImage(logoImage, "PNG", logoX, logoY, logoSize, logoSize);
  }

  // =====================
  // BACK PAGE - QR Code on Left, Name/ID on Right
  // =====================
  pdf.addPage([210, 100], "landscape");

  pdf.setFillColor(126, 186, 86);
  pdf.rect(0, 0, pageWidth, pageHeight, "F");

  pdf.setFillColor(255, 255, 255);
  pdf.rect(padding, padding, pageWidth - 2 * padding, pageHeight - 2 * padding, "F");

  const qrSize = 70;
  const qrX = padding + 16;
  const qrY = (pageHeight - qrSize) / 2;

  const qrCanvas = await generateQRCodeCanvas(member.memberId, qrSize * 3.78);
  if (qrCanvas) {
    const qrImage = qrCanvas.toDataURL("image/png");
    pdf.addImage(qrImage, "PNG", qrX, qrY, qrSize, qrSize);
  }

  const qrTextY = qrY + qrSize + 3;
  pdf.setFontSize(9);
  pdf.setTextColor(100, 100, 100);
  pdf.setFont(undefined, "normal");
  pdf.text("Scan to Verify", qrX + qrSize / 2, qrTextY, { align: "center" });

  const detailsX = qrX + qrSize + 18;
  const detailsWidth = pageWidth - detailsX - padding - 8;

  pdf.setFillColor(126, 186, 86);
  pdf.rect(detailsX - 3, padding, detailsWidth + 6, pageHeight - 2 * padding, "F");

  const backNameY = padding + 18;
  pdf.setFontSize(28);
  pdf.setTextColor(255, 255, 255);
  pdf.setFont(undefined, "bold");
  pdf.text(`${member.fullName}`, detailsX + 4, backNameY, { maxWidth: detailsWidth - 8 });

  const backIdY = backNameY + 18;
  pdf.setFontSize(20);
  pdf.setFont(undefined, "normal");
  pdf.text(`ID: ${member.memberId}`, detailsX + 4, backIdY, { maxWidth: detailsWidth - 8 });

  return pdf;
}

export async function generateMemberIDPDF(member) {
  try {
    const pdf = await buildMemberIDPDF(member);
    pdf.save(`${member.memberId}.pdf`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error generating member ID PDF:", error);
    throw error;
  }
}

/**
 * Returns a high-resolution QR code for the given data as a PNG data URL.
 * Size defaults to 600px — large enough for long member IDs to scan reliably.
 */
export async function generateQRCodeDataUrl(data, size = 600) {
  const canvas = await generateQRCodeCanvas(data, size);
  if (!canvas) throw new Error("QR canvas generation failed");
  return canvas.toDataURL("image/png");
}

function generateQRCodeCanvas(data, size) {
  return new Promise((resolve) => {
    const tempContainer = document.createElement("div");
    tempContainer.style.display = "none";
    document.body.appendChild(tempContainer);

    function create() {
      // eslint-disable-next-line no-undef
      new QRCode(tempContainer, {
        text: data,
        width: size,
        height: size,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.M, // eslint-disable-line no-undef
      });

      setTimeout(() => {
        const canvas = tempContainer.querySelector("canvas");
        document.body.removeChild(tempContainer);
        resolve(canvas);
      }, 100);
    }

    if (!window.QRCode) {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
      script.async = true;
      script.onload = create;
      document.head.appendChild(script);
    } else {
      create();
    }
  });
}

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
  } catch {
    return null;
  }
}
