import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";

export async function createInvoicePdf(input: { reservationId: number; amount: number; currency: string; voyage: string; customer: string; paymentReference: string }) {
  const qrBytes = await QRCode.toBuffer(input.paymentReference, { type: "png", width: 180, margin: 1 });
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const qr = await pdf.embedPng(qrBytes);
  page.drawRectangle({ x: 36, y: 36, width: 523, height: 770, borderWidth: 1, borderColor: rgb(0.78, 0.84, 0.86) });
  page.drawRectangle({ x: 36, y: 705, width: 523, height: 101, color: rgb(0.93, 0.97, 0.98) });
  page.drawText("KivuPort - Facture", { x: 48, y: 770, size: 24, font: bold, color: rgb(0.04, 0.22, 0.28) });
  page.drawText(`Facture #KP-${String(input.reservationId).padStart(4, "0")}`, { x: 48, y: 720, size: 16, font: bold });
  page.drawText("PAIEMENT CONFIRME", { x: 390, y: 722, size: 10, font: bold, color: rgb(0.05, 0.48, 0.31) });
  page.drawLine({ start: { x: 48, y: 695 }, end: { x: 545, y: 695 }, thickness: 1, color: rgb(0.78, 0.84, 0.86) });
  page.drawText("DETAILS DE LA RESERVATION", { x: 48, y: 675, size: 10, font: bold, color: rgb(0.04, 0.22, 0.28) });
  page.drawText(`Client: ${input.customer || "-"}`, { x: 48, y: 675, size: 12, font });
  page.drawText(`Voyage: ${input.voyage}`, { x: 48, y: 650, size: 12, font });
  page.drawText(`Montant paye: ${input.amount.toLocaleString("fr-FR")} ${input.currency}`, { x: 48, y: 600, size: 13, font: bold, color: rgb(0.04, 0.22, 0.28) });
  page.drawText(`Reference paiement: ${input.paymentReference}`, { x: 48, y: 555, size: 11, font });
  page.drawText("QR DE VERIFICATION", { x: 385, y: 535, size: 10, font: bold, color: rgb(0.04, 0.22, 0.28) });
  page.drawImage(qr, { x: 355, y: 350, width: 170, height: 170 });
  page.drawLine({ start: { x: 48, y: 315 }, end: { x: 545, y: 315 }, thickness: 1, color: rgb(0.78, 0.84, 0.86) });
  page.drawText("Cette facture confirme la reception de votre paiement.", { x: 48, y: 285, size: 11, font });
  page.drawText("Merci de voyager avec KivuPort.", { x: 48, y: 90, size: 10, font, color: rgb(0.35, 0.35, 0.35) });
  return pdf.save();
}