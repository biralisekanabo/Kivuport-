import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminEmail } from "@/lib/admin";
import { sendBrevoEmail } from "@/lib/brevo";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;
  if (!token) return NextResponse.json({ error: "Authorization required." }, { status: 401 });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !isAdminEmail(authData.user?.email)) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const { id } = await context.params;
  const reservationId = Number(id);
  if (!Number.isInteger(reservationId)) return NextResponse.json({ error: "Invalid reservation id." }, { status: 400 });

  const { data: reservation, error: reservationError } = await supabase
    .from("reservations")
    .select("id, statut, date_embarquement, prix_total, client:client(nom, prenom, email), voyage:voyages(code_voyage), pavillon:pavillons!reservations_idpavillon_fkey(nom)")
    .eq("id", reservationId)
    .single();
  if (reservationError || !reservation) return NextResponse.json({ error: reservationError?.message || "Reservation not found." }, { status: 404 });
  if (reservation.statut !== "confirme") return NextResponse.json({ error: "Reservation must be confirmed before notification." }, { status: 409 });

  const client = reservation.client as { nom?: string; prenom?: string; email?: string } | null;
  if (!client?.email) return NextResponse.json({ error: "The reservation has no client email." }, { status: 422 });

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    const paymentUrl = `${appUrl}/reservations#reservation-${reservationId}`;
    const detailUrl = `${appUrl}/reservations#reservation-${reservationId}`;
    const voyage = (reservation.voyage as { code_voyage?: string } | null)?.code_voyage || "KivuPort";
    const pavilion = (reservation.pavillon as { nom?: string } | null)?.nom || "-";
    const result = await sendBrevoEmail({
      to: [{ email: client.email, name: [client.prenom, client.nom].filter(Boolean).join(" ") }],
      subject: `Réservation ${reservationId} confirmée - KivuPort`,
      textContent: `Votre réservation ${reservationId} pour le voyage ${voyage} est confirmée. Pavillon : ${pavilion}. Montant : ${Number(reservation.prix_total || 0).toLocaleString("fr-FR")} FC. Paiement : ${paymentUrl}. Détail : ${detailUrl}.`,
      htmlContent: `<h2>Réservation confirmée</h2><p>Bonjour ${client.prenom || ""},</p><p>Votre réservation <strong>#${reservationId}</strong> est confirmée et payable.</p><p>Voyage : ${voyage}<br>Embarquement : ${new Date(reservation.date_embarquement).toLocaleString("fr-FR")}<br>Pavillon : ${pavilion}<br>Montant : ${Number(reservation.prix_total || 0).toLocaleString("fr-FR")} FC<br>Statut : confirmée</p><p><a href="${paymentUrl}">Accéder au paiement</a> · <a href="${detailUrl}">Voir le détail de la réservation</a></p><p>Merci de voyager avec KivuPort.</p>`,
    });
    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Brevo email failed." }, { status: 502 });
  }
}