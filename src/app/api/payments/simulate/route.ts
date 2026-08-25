import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createInvoicePdf } from "@/lib/invoice";
import { sendBrevoEmail } from "@/lib/brevo";
import { paymentReceiptEmail } from "@/lib/email-templates";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const body = await request.json().catch(() => null) as { reservationId?: number } | null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!token || !body?.reservationId || !url || !anonKey || !serviceRoleKey) return NextResponse.json({ error: "Configuration ou authentification manquante." }, { status: 400 });

  const userClient = createClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: user, error: userError } = await userClient.auth.getUser(token);
  if (userError || !user.user?.email) return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  const serviceClient = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: reservation, error: reservationError } = await serviceClient.from("reservations").select("id, statut, prix_total, idclient, client:client(nom, prenom, email), voyage:voyages(code_voyage)").eq("id", body.reservationId).limit(1).maybeSingle();
  const reservationClient = reservation?.client as { nom?: string; prenom?: string; email?: string } | null;
  if (reservationError || !reservation) return NextResponse.json({ error: reservationError?.message || "Réservation introuvable." }, { status: 404 });
  if (reservationClient?.email?.toLowerCase() !== user.user.email.toLowerCase()) return NextResponse.json({ error: "Accès à la réservation refusé." }, { status: 403 });
  if (reservation.statut !== "confirme") return NextResponse.json({ error: "La réservation doit être confirmée." }, { status: 409 });

  const { data: pendingPayment } = await serviceClient.from("paiements").select("id, montant").eq("idreservation", reservation.id).eq("statut", "en_attente").order("date_paiement", { ascending: false }).limit(1).maybeSingle();
  let paymentId = pendingPayment?.id;
  let amount = Number(pendingPayment?.montant ?? reservation.prix_total ?? 0);
  if (!paymentId) {
    const { data: createdPayment, error: paymentError } = await serviceClient.from("paiements").insert({ montant: amount, devise: "CDF", mode_paiement: "MOMO", date_paiement: new Date().toISOString(), statut: "en_attente", idreservation: reservation.id }).select("id, montant").single();
    if (paymentError || !createdPayment) return NextResponse.json({ error: paymentError?.message || "Impossible de créer le paiement." }, { status: 409 });
    paymentId = createdPayment.id;
    amount = Number(createdPayment.montant);
  }
  const { data: transaction } = await serviceClient.from("payment_transactions").select("external_reference").eq("idpaiement", paymentId).maybeSingle();
  const externalReference = transaction?.external_reference || `KP-${reservation.id}-${crypto.randomUUID().replaceAll("-", "")}`;
  if (!transaction) {
    const { error: transactionError } = await serviceClient.from("payment_transactions").insert({ idpaiement: paymentId, external_reference: externalReference, provider: "maisha_pay_simulated", provider_status: "pending" });
    if (transactionError) return NextResponse.json({ error: transactionError.message }, { status: 409 });
  }
  const { error: paidError } = await serviceClient.from("paiements").update({ statut: "paye", date_paiement: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", paymentId);
  if (paidError) return NextResponse.json({ error: paidError.message }, { status: 409 });
  await serviceClient.from("payment_transactions").update({ provider_status: "succeeded", metadata: { simulated: true, provider: "maisha_pay" }, updated_at: new Date().toISOString() }).eq("idpaiement", paymentId);
  const { error: reservationUpdateError } = await serviceClient.from("reservations").update({ statut: "arrive", updated_at: new Date().toISOString() }).eq("id", reservation.id);
  if (reservationUpdateError) return NextResponse.json({ error: reservationUpdateError.message }, { status: 409 });
  await serviceClient.from("reservation_status_history").insert({ reservation_id: reservation.id, from_status: "confirme", to_status: "arrive", actor_email: user.user.email, reason: "payment_simulated" });
  const client = reservation?.client as { nom?: string; prenom?: string; email?: string } | null;
  if (client?.email && reservation) {
    const voyage = (reservation.voyage as { code_voyage?: string } | null)?.code_voyage || "KivuPort";
    const pdf = await createInvoicePdf({ reservationId: reservation.id, amount, currency: "CDF", voyage, customer: [client.prenom, client.nom].filter(Boolean).join(" "), paymentReference: externalReference });
    await sendBrevoEmail({
      to: [{ email: client.email, name: [client.prenom, client.nom].filter(Boolean).join(" ") }],
      subject: `Paiement reçu - réservation #${reservation.id}`,
      textContent: `Votre paiement pour la réservation #${reservation.id} a été enregistré. Votre facture est jointe.`,
      htmlContent: paymentReceiptEmail({ reservationId: reservation.id, customer: [client.prenom, client.nom].filter(Boolean).join(" "), voyage, amount: `${amount.toLocaleString("fr-FR")} CDF` }),
      attachment: [{ content: Buffer.from(pdf).toString("base64"), name: `kivuport-facture-${reservation.id}.pdf` }],
    });
  }
  return NextResponse.json({ success: true, payment: { id: paymentId, amount, reservationId: reservation.id }, externalReference });
}