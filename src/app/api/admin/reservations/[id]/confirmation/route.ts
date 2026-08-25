import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminEmail } from "@/lib/admin";
import { sendBrevoEmail } from "@/lib/brevo";
import { confirmationEmail } from "@/lib/email-templates";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;
  if (!token) return NextResponse.json({ error: "Authorization required." }, { status: 401 });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !isAdminEmail(authData.user?.email)) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const { id } = await context.params;
  const reservationId = Number(id);
  if (!Number.isInteger(reservationId)) return NextResponse.json({ error: "Invalid reservation id." }, { status: 400 });

  const { data: reservations, error: reservationError } = await supabase
    .from("reservations")
    .select("id, statut, date_embarquement, prix_total, client:client(nom, prenom, email), voyage:voyages(code_voyage), pavillon:pavillons!reservations_idpavillon_fkey(nom)")
    .eq("id", reservationId)
    .limit(1);
  const reservation = reservations?.[0];
  if (reservationError || !reservation) return NextResponse.json({ error: reservationError?.message || "Reservation not found." }, { status: 404 });
  if (reservation.statut !== "confirme") return NextResponse.json({ error: "Reservation must be confirmed before notification." }, { status: 409 });

  const client = reservation.client as { nom?: string; prenom?: string; email?: string } | null;
  if (!client?.email) return NextResponse.json({ error: "The reservation has no client email." }, { status: 422 });

  try {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) return NextResponse.json({ error: "Supabase service role is not configured." }, { status: 503 });
    const serviceClient = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: paymentLink, error: paymentLinkError } = await serviceClient.rpc("create_kivuport_public_payment_link", { p_reservation_id: reservationId });
    let publicPaymentLink = paymentLink?.[0];
    if (paymentLinkError || !publicPaymentLink?.external_reference) {
      const { data: existingPayment } = await serviceClient.from("paiements").select("id, montant").eq("idreservation", reservationId).eq("statut", "en_attente").order("date_paiement", { ascending: false }).limit(1).maybeSingle();
      let paymentId = existingPayment?.id;
      if (!paymentId) {
        const { data: createdPayment, error: paymentError } = await serviceClient.from("paiements").insert({ montant: reservation.prix_total, devise: "CDF", mode_paiement: "MOMO", date_paiement: new Date().toISOString(), statut: "en_attente", idreservation: reservationId }).select("id, montant").single();
        if (paymentError || !createdPayment) return NextResponse.json({ error: paymentLinkError?.message || paymentError?.message || "Unable to create payment link." }, { status: 409 });
        paymentId = createdPayment.id;
        publicPaymentLink = createdPayment;
      }
      const { data: existingTransaction } = await serviceClient.from("payment_transactions").select("external_reference").eq("idpaiement", paymentId).maybeSingle();
      const externalReference = existingTransaction?.external_reference || `KP-${reservationId}-${crypto.randomUUID().replaceAll("-", "")}`;
      if (!existingTransaction) {
        const { error: transactionError } = await serviceClient.from("payment_transactions").insert({ idpaiement: paymentId, external_reference: externalReference, provider: "maisha_pay" });
        if (transactionError) return NextResponse.json({ error: transactionError.message }, { status: 409 });
      }
      publicPaymentLink = { ...publicPaymentLink, external_reference: externalReference };
    }
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    const paymentUrl = `${appUrl}/paiement/${encodeURIComponent(publicPaymentLink.external_reference)}`;
    const detailUrl = `${appUrl}/reservation/${encodeURIComponent(publicPaymentLink.external_reference)}`;
    const voyage = (reservation.voyage as { code_voyage?: string } | null)?.code_voyage || "KivuPort";
    const pavilion = (reservation.pavillon as { nom?: string } | null)?.nom || "-";
    const result = await sendBrevoEmail({
      to: [{ email: client.email, name: [client.prenom, client.nom].filter(Boolean).join(" ") }],
      subject: `Réservation ${reservationId} confirmée - KivuPort`,
      textContent: `Votre réservation ${reservationId} pour le voyage ${voyage} est confirmée. Pavillon : ${pavilion}. Montant : ${Number(reservation.prix_total || 0).toLocaleString("fr-FR")} FC. Paiement : ${paymentUrl}. Détail : ${detailUrl}.`,
      htmlContent: confirmationEmail({ reservationId, customer: [client.prenom, client.nom].filter(Boolean).join(" "), voyage, pavilion, departure: new Date(reservation.date_embarquement).toLocaleString("fr-FR"), amount: `${Number(reservation.prix_total || 0).toLocaleString("fr-FR")} FC`, paymentUrl, detailUrl }),
    });
    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Brevo email failed." }, { status: 502 });
  }
}