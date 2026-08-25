import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createInvoicePdf } from "@/lib/invoice";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token")?.trim();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!token || !supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Lien de reçu invalide." }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: transaction, error: transactionError } = await supabase
    .from("payment_transactions")
    .select("idpaiement, external_reference")
    .eq("external_reference", token)
    .maybeSingle();

  if (transactionError || !transaction) {
    return NextResponse.json({ error: transactionError?.message || "Reçu introuvable." }, { status: 404 });
  }

  const { data: payment, error: paymentError } = await supabase
    .from("paiements")
    .select("id, montant, devise, statut, idreservation")
    .eq("id", transaction.idpaiement)
    .maybeSingle();

  if (paymentError || !payment) {
    return NextResponse.json({ error: paymentError?.message || "Paiement introuvable." }, { status: 404 });
  }

  if (payment.statut !== "paye") {
    return NextResponse.json({ error: "Le reçu est disponible après confirmation du paiement." }, { status: 409 });
  }

  const { data: reservation, error: reservationError } = await supabase
    .from("reservations")
    .select("id, prix_total, client:client(nom, prenom), voyage:voyages(code_voyage)")
    .eq("id", payment.idreservation)
    .maybeSingle();

  if (reservationError || !reservation) {
    return NextResponse.json({ error: reservationError?.message || "Réservation introuvable." }, { status: 404 });
  }

  const client = reservation.client as { nom?: string; prenom?: string } | null;
  const voyage = (reservation.voyage as { code_voyage?: string } | null)?.code_voyage || "KivuPort";
  const pdf = await createInvoicePdf({
    reservationId: reservation.id,
    amount: Number(payment.montant || reservation.prix_total || 0),
    currency: payment.devise || "CDF",
    voyage,
    customer: [client?.prenom, client?.nom].filter(Boolean).join(" "),
    paymentReference: transaction.external_reference,
  });

  return new NextResponse(pdf as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="kivuport-facture-${reservation.id}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
