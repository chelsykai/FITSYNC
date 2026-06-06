import jsPDF from "jspdf";
import logoUrl from "../assets/logo.png";

async function buildMemberIDPDF(member) {
  if (!member?.memberId || !member?.fullName) {
    throw new Error("Member ID and name are required");
  }

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Generate the branded QR card as the main page
  try {
    const brandedCardImage = await generateMemberQRCardDataUrl(member);
    
    // Add branded card page (portrait A4 for the card image)
    const imgWidth = pageWidth;
    const imgHeight = (imgWidth * 3) / 2; // 2:3 aspect ratio from 1024x1536
    pdf.addImage(brandedCardImage, "PNG", 0, 0, imgWidth, imgHeight);
  } catch (err) {
    console.warn("Branded card generation failed, using fallback design:", err);
    // Fallback to simple design if branded card fails
    pdf.setFillColor(126, 186, 86);
    pdf.rect(0, 0, pageWidth, pageHeight, "F");
    
    pdf.setFillColor(255, 255, 255);
    pdf.rect(5, 5, pageWidth - 10, pageHeight - 10, "F");
    
    pdf.setFontSize(20);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont(undefined, "bold");
    pdf.text(`${member.fullName}`, pageWidth / 2, 30, { align: "center" });
    
    pdf.setFontSize(14);
    pdf.setFont(undefined, "normal");
    pdf.text(`Member ID: ${member.memberId}`, pageWidth / 2, 50, { align: "center" });
    
    const qrCanvas = await generateQRCodeCanvas(member.memberId, 400);
    if (qrCanvas) {
      const qrImage = qrCanvas.toDataURL("image/png");
      const qrSize = 60;
      const qrX = (pageWidth - qrSize) / 2;
      pdf.addImage(qrImage, "PNG", qrX, 70, qrSize, qrSize);
    }
  }

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

/**
 * Returns a branded member QR ID card as a PNG data URL for welcome emails.
 * The QR itself stays high contrast and untouched so scanners can read it.
 */
export async function generateMemberQRCardDataUrl(member) {
  const memberId = member?.memberId || member?.member_id || "";
  const fullName = member?.fullName || member?.full_name || "Member";

  if (!memberId) {
    throw new Error("Member ID is required to generate QR card");
  }

  const width = 1024;
  const height = 1536;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  const green = "#6cad3f";
  const paleGreen = "#eaf4e3";
  const black = "#080c0d";

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = black;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(width, 0);
  ctx.lineTo(width, 210);
  ctx.quadraticCurveTo(width / 2, 380, 0, 210);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = green;
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(0, 210);
  ctx.quadraticCurveTo(width / 2, 380, width, 210);
  ctx.stroke();

  drawWatermark(ctx, 45, 500, 220, paleGreen);
  drawWatermark(ctx, 855, 500, 220, paleGreen);

  const logoImage = await loadCanvasImage(logoUrl);
  drawRoundedRect(ctx, 394, 105, 236, 236, 118, "#ffffff");
  if (logoImage) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(512, 223, 92, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(logoImage, 420, 131, 184, 184);
    ctx.restore();
  } else {
    drawSimpleFitnessMark(ctx, 512, 223, green);
  }

  ctx.textAlign = "center";
  ctx.fillStyle = black;
  ctx.font = "800 58px Montserrat, Arial, sans-serif";
  ctx.fillText("FITNESS", 512, 395);
  ctx.fillStyle = green;
  ctx.font = "700 24px Montserrat, Arial, sans-serif";
  ctx.letterSpacing = "8px";
  ctx.fillText("STRONGER TOGETHER", 512, 430);
  ctx.letterSpacing = "0px";

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.16)";
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 16;
  drawRoundedRect(ctx, 236, 485, 552, 552, 40, "#ffffff");
  ctx.restore();

  ctx.strokeStyle = green;
  ctx.lineWidth = 4;
  strokeRoundedRect(ctx, 252, 501, 520, 520, 32);

  const qrCanvas = await generateQRCodeCanvas(memberId, 480);
  if (!qrCanvas) throw new Error("QR canvas generation failed");
  ctx.drawImage(qrCanvas, 272, 521, 480, 480);

  ctx.strokeStyle = green;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(185, 1110);
  ctx.lineTo(365, 1110);
  ctx.moveTo(660, 1110);
  ctx.lineTo(840, 1110);
  ctx.stroke();

  ctx.fillStyle = green;
  ctx.beginPath();
  ctx.arc(407, 1110, 6, 0, Math.PI * 2);
  ctx.arc(617, 1110, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = "700 28px Montserrat, Arial, sans-serif";
  ctx.fillText("MEMBER", 512, 1120);

  ctx.fillStyle = "#050505";
  fitCenteredText(ctx, fullName, 512, 1212, 68, 760, "800");

  strokeRoundedRect(ctx, 190, 1262, 644, 110, 20);
  drawIdIcon(ctx, 238, 1288, green);

  ctx.textAlign = "left";
  ctx.fillStyle = green;
  ctx.font = "700 30px Montserrat, Arial, sans-serif";
  ctx.fillText("MEMBER ID", 385, 1311);
  ctx.fillStyle = "#050505";
  fitLeftText(ctx, memberId, 385, 1354, 42, 410, "700");

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

function drawRoundedRect(ctx, x, y, width, height, radius, fillStyle) {
  ctx.fillStyle = fillStyle;
  roundedPath(ctx, x, y, width, height, radius);
  ctx.fill();
}

function strokeRoundedRect(ctx, x, y, width, height, radius) {
  roundedPath(ctx, x, y, width, height, radius);
  ctx.stroke();
}

function roundedClip(ctx, x, y, width, height, radius) {
  roundedPath(ctx, x, y, width, height, radius);
  ctx.clip();
}

function roundedPath(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
}

async function loadCanvasImage(url) {
  const dataUrl = await loadImageAsDataURL(url);
  if (!dataUrl) return null;

  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = dataUrl;
  });
}

function drawWatermark(ctx, cx, cy, size, color) {
  ctx.save();
  ctx.globalAlpha = 0.58;
  ctx.strokeStyle = color;
  ctx.lineWidth = 46;
  ctx.beginPath();
  ctx.arc(cx, cy + size / 2, size, Math.PI * 1.15, Math.PI * 1.88);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy + size / 2, size, Math.PI * 0.15, Math.PI * 0.88);
  ctx.stroke();
  ctx.lineCap = "round";
  ctx.lineWidth = 70;
  ctx.beginPath();
  ctx.moveTo(cx - 80, cy + size / 2);
  ctx.lineTo(cx - 35, cy + size / 2);
  ctx.moveTo(cx + 35, cy + size / 2);
  ctx.lineTo(cx + 80, cy + size / 2);
  ctx.stroke();
  ctx.restore();
}

function drawSimpleFitnessMark(ctx, cx, cy, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.arc(cx, cy, 72, Math.PI * 1.05, Math.PI * 1.95);
  ctx.arc(cx, cy, 72, Math.PI * 0.05, Math.PI * 0.95);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.fillRect(cx - 72, cy - 24, 34, 48);
  ctx.fillRect(cx + 38, cy - 24, 34, 48);
  ctx.fillRect(cx - 34, cy - 14, 68, 28);
  ctx.restore();
}

function drawIdIcon(ctx, x, y, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 4;
  strokeRoundedRect(ctx, x, y, 116, 76, 6);
  ctx.beginPath();
  ctx.arc(x + 32, y + 35, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + 32, y + 66, 25, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(x + 62, y + 28, 36, 5);
  ctx.fillRect(x + 62, y + 46, 45, 5);
  ctx.fillRect(x + 62, y + 64, 30, 5);
  ctx.restore();
}

function fitCenteredText(ctx, text, x, y, maxSize, maxWidth, weight) {
  let size = maxSize;
  do {
    ctx.font = `${weight} ${size}px Montserrat, Arial, sans-serif`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 2;
  } while (size > 28);

  ctx.textAlign = "center";
  ctx.fillText(text, x, y);
}

function fitLeftText(ctx, text, x, y, maxSize, maxWidth, weight) {
  let size = maxSize;
  do {
    ctx.font = `${weight} ${size}px Montserrat, Arial, sans-serif`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 2;
  } while (size > 22);

  ctx.textAlign = "left";
  ctx.fillText(text, x, y);
}
