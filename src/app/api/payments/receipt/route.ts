import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token")?.trim();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!token || !url || !key) return NextResponse.json({ error: "Reçu indisponible." }, { status: 400 });

  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: transaction } = await supabase
    .from("payment_transactions")
    .select("idpaiement, external_reference")
    .eq("external_reference", token)
    .maybeSingle();
  if (!transaction) return NextResponse.json({ error: "Paiement introuvable." }, { status: 404 });

  const { data: payment } = await supabase
    .from("paiements")
    .select("idreservation, montant, devise, mode_paiement, date_paiement, statut")
    .eq("id", transaction.idpaiement)
    .single();
  if (!payment || payment.statut !== "paye") return NextResponse.json({ error: "Le paiement n'est pas confirmé." }, { status: 409 });

  const { data: reservation } = await supabase
    .from("reservations")
    .select("id, client:client(nom, prenom, email), voyage:voyages(code_voyage)")
    .eq("id", payment.idreservation)
    .single();
  if (!reservation) return NextResponse.json({ error: "Réservation introuvable." }, { status: 404 });

  return NextResponse.json({
    reference: transaction.external_reference,
    reservationId: reservation.id,
    amount: payment.montant,
    currency: payment.devise,
    method: payment.mode_paiement,
    paidAt: payment.date_paiement,
    client: reservation.client,
    voyage: reservation.voyage,
  });
}
