import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createInvoicePdf } from "@/lib/invoice";
import { sendBrevoEmail } from "@/lib/brevo";
import { paymentReceiptEmail } from "@/lib/email-templates";

export const runtime = "nodejs";

type PaymentMethod = "maisha_pay" | "card";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { token?: string; method?: PaymentMethod } | null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || !body?.token?.trim()) return NextResponse.json({ error: "Lien de paiement invalide." }, { status: 400 });
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: transaction, error: transactionError } = await supabase.from("payment_transactions").select("idpaiement, external_reference").eq("external_reference", body.token.trim()).maybeSingle();
  if (transactionError || !transaction) return NextResponse.json({ error: "Lien de paiement introuvable." }, { status: 404 });
  const { data: payment, error: paymentError } = await supabase.from("paiements").select("id, montant, statut, idreservation").eq("id", transaction.idpaiement).single();
  if (paymentError || !payment) return NextResponse.json({ error: "Paiement introuvable." }, { status: 404 });
  if (payment.statut === "paye") return NextResponse.json({ success: true, alreadyPaid: true, payment });
  if (!body.method || !["maisha_pay", "card"].includes(body.method)) return NextResponse.json({ error: "Choisissez un mode de paiement valide." }, { status: 400 });
  const { data, error } = await supabase.rpc("process_kivuport_payment_webhook", { p_external_reference: transaction.external_reference, p_provider_status: "succeeded", p_amount: Number(payment.montant), p_metadata: { simulated: true, provider: body.method, token_payment: true } });
  if (error) return NextResponse.json({ error: error.message }, { status: 409 });
  const { data: reservation } = await supabase.from("reservations").select("id, prix_total, client:client(nom, prenom, email), voyage:voyages(code_voyage)").eq("id", payment.idreservation).single();
  const client = reservation?.client as { nom?: string; prenom?: string; email?: string } | null;
  let emailSent = false;
  if (client?.email && reservation) {
    const voyage = (reservation.voyage as { code_voyage?: string } | null)?.code_voyage || "KivuPort";
    const pdf = await createInvoicePdf({ reservationId: reservation.id, amount: Number(reservation.prix_total || 0), currency: "CDF", voyage, customer: [client.prenom, client.nom].filter(Boolean).join(" "), paymentReference: transaction.external_reference });
    try {
      await sendBrevoEmail({
      to: [{ email: client.email, name: [client.prenom, client.nom].filter(Boolean).join(" ") }],
      subject: `Paiement reçu - réservation #${reservation.id}`,
      textContent: `Votre paiement pour la réservation #${reservation.id} a été enregistré. Votre facture est jointe.`,
      htmlContent: paymentReceiptEmail({ reservationId: reservation.id, customer: [client.prenom, client.nom].filter(Boolean).join(" "), voyage, amount: `${Number(reservation.prix_total || 0).toLocaleString("fr-FR")} CDF` }),
      attachment: [{ content: Buffer.from(pdf).toString("base64"), name: `kivuport-facture-${reservation.id}.pdf` }],
      });
      emailSent = true;
    } catch (emailError) {
      console.error("Payment email failed after successful payment", emailError);
    }
  }
  return NextResponse.json({ success: true, payment: data?.[0] || payment, emailSent });
}
