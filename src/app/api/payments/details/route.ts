import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token")?.trim();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!token || !url || !key) return NextResponse.json({ error: "Lien de paiement invalide." }, { status: 400 });

  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: transaction } = await supabase
    .from("payment_transactions")
    .select("idpaiement, external_reference")
    .eq("external_reference", token)
    .maybeSingle();
  if (!transaction) return NextResponse.json({ error: "Réservation introuvable." }, { status: 404 });

  const { data: payment } = await supabase
    .from("paiements")
    .select("idreservation, montant, statut")
    .eq("id", transaction.idpaiement)
    .single();
  if (!payment) return NextResponse.json({ error: "Paiement introuvable." }, { status: 404 });

  const { data: reservation, error } = await supabase
    .from("reservations")
    .select("id, statut, prix_total, client:client(nom, prenom, email, telephone), voyage:voyages(code_voyage)")
    .eq("id", payment.idreservation)
    .single();
  if (error || !reservation) return NextResponse.json({ error: "Réservation introuvable." }, { status: 404 });

  const client = reservation.client as { nom?: string; prenom?: string; email?: string; telephone?: string } | null;
  return NextResponse.json({
    id: reservation.id,
    reference: transaction.external_reference,
    amount: Number(reservation.prix_total ?? payment.montant ?? 0),
    status: reservation.statut,
    alreadyPaid: payment.statut === "paye" || reservation.statut === "arrive",
    destination: (reservation.voyage as { code_voyage?: string } | null)?.code_voyage || "KivuPort",
    clientName: [client?.prenom, client?.nom].filter(Boolean).join(" ") || "Client",
    clientPhone: client?.telephone || "",
  });
}
