import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendBrevoEmail } from "@/lib/brevo";

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;
  const body = await request.json().catch(() => null) as { reservationId?: number; kind?: "created" | "paid" } | null;
  if (!token || !body?.reservationId || !body.kind) return NextResponse.json({ error: "Authorization, reservationId and kind are required." }, { status: 400 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  const supabase = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData.user?.email) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { data: reservation, error } = await supabase.from("reservations").select("id, statut, prix_total, client:client(nom, prenom, email), voyage:voyages(code_voyage)").eq("id", body.reservationId).single();
  if (error || !reservation) return NextResponse.json({ error: error?.message || "Reservation not found." }, { status: 404 });
  const client = reservation.client as { nom?: string; prenom?: string; email?: string } | null;
  if (client?.email?.toLowerCase() !== authData.user.email.toLowerCase()) return NextResponse.json({ error: "Reservation access denied." }, { status: 403 });

  const voyage = (reservation.voyage as { code_voyage?: string } | null)?.code_voyage || "KivuPort";
  const isPaid = body.kind === "paid";
  try {
    await sendBrevoEmail({
      to: [{ email: client.email, name: [client.prenom, client.nom].filter(Boolean).join(" ") }],
      subject: isPaid ? `Paiement reçu - réservation #${reservation.id}` : `Réservation reçue - KivuPort`,
      textContent: isPaid ? `Votre paiement pour la réservation #${reservation.id} a été enregistré.` : `Votre réservation #${reservation.id} pour ${voyage} a été reçue.`,
      htmlContent: isPaid ? `<h2>Paiement reçu</h2><p>Votre paiement de ${Number(reservation.prix_total || 0).toLocaleString("fr-FR")} FC pour la réservation <strong>#${reservation.id}</strong> a été enregistré.</p>` : `<h2>Réservation reçue</h2><p>Votre demande pour le voyage <strong>${voyage}</strong> est enregistrée et attend confirmation.</p>`,
    });
    return NextResponse.json({ success: true });
  } catch (notificationError) {
    return NextResponse.json({ error: notificationError instanceof Error ? notificationError.message : "Brevo email failed." }, { status: 502 });
  }
}