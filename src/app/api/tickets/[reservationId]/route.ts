import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ reservationId: string }> }) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !url || !key) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const supabase = createClient(url, key, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user?.email) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const reservationId = Number((await context.params).reservationId);
  if (!Number.isInteger(reservationId) || reservationId < 1) return NextResponse.json({ error: "Invalid reservation id." }, { status: 400 });

  const { data: ticket, error: ticketError } = await supabase.rpc("issue_kivuport_ticket", { p_reservation_id: reservationId });
  if (ticketError || !ticket) return NextResponse.json({ error: ticketError?.message || "Ticket unavailable." }, { status: 409 });
  const { data: reservation, error } = await supabase.from("reservations").select("id, date_embarquement, prix_total, client:client(nom, prenom, email), voyage:voyages(code_voyage), pavillon:pavillons(nom)").eq("id", reservationId).single();
  if (error || !reservation) return NextResponse.json({ error: "Reservation not found." }, { status: 404 });

  const client = reservation.client as { nom?: string; prenom?: string; email?: string } | null;
  if (client?.email?.toLowerCase() !== userData.user.email.toLowerCase()) return NextResponse.json({ error: "Reservation access denied." }, { status: 403 });
  const code = (ticket as { ticket_code: string }).ticket_code;
  const qrBytes = await QRCode.toBuffer(code, { type: "png", width: 220, margin: 1 });
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const qr = await pdf.embedPng(qrBytes);
  page.drawText("KivuPort - Billet d'embarquement", { x: 48, y: 770, size: 22, font: bold, color: rgb(0.04, 0.22, 0.28) });
  page.drawText(`Reservation #${reservation.id}`, { x: 48, y: 725, size: 16, font: bold });
  page.drawText(`Passager: ${[client?.prenom, client?.nom].filter(Boolean).join(" ") || "-"}`, { x: 48, y: 680, size: 12, font });
  page.drawText(`Voyage: ${(reservation.voyage as { code_voyage?: string } | null)?.code_voyage || "-"}`, { x: 48, y: 655, size: 12, font });
  page.drawText(`Embarquement: ${new Date(reservation.date_embarquement).toLocaleString("fr-FR")}`, { x: 48, y: 630, size: 12, font });
  page.drawText(`Pavillon: ${(reservation.pavillon as { nom?: string } | null)?.nom || "-"}`, { x: 48, y: 605, size: 12, font });
  page.drawText(`Montant: ${Number(reservation.prix_total || 0).toLocaleString("fr-FR")} FC`, { x: 48, y: 580, size: 12, font });
  page.drawText(`Code billet: ${code}`, { x: 48, y: 535, size: 14, font: bold, color: rgb(0.85, 0.32, 0.12) });
  page.drawImage(qr, { x: 355, y: 570, width: 170, height: 170 });
  page.drawText("Ce billet est personnel et ne peut etre utilise qu'une fois.", { x: 48, y: 90, size: 10, font, color: rgb(0.35, 0.35, 0.35) });

  const bytes = await pdf.save();
  return new NextResponse(bytes as BodyInit, { status: 200, headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="kivuport-ticket-${reservationId}.pdf"`, "Cache-Control": "no-store" } });
}
