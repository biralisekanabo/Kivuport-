import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token")?.trim();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || !token) return NextResponse.json({ error: "Lien de réservation invalide." }, { status: 400 });
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: transaction } = await supabase.from("payment_transactions").select("idpaiement").eq("external_reference", token).maybeSingle();
  if (!transaction) return NextResponse.json({ error: "Réservation introuvable." }, { status: 404 });
  const { data: payment } = await supabase.from("paiements").select("idreservation").eq("id", transaction.idpaiement).single();
  const { data: reservation, error } = await supabase.from("reservations").select("id, statut, date_embarquement, prix_total, type_reservation, client:client(nom, prenom), voyage:voyages(code_voyage), pavillon:pavillons(nom)").eq("id", payment?.idreservation || 0).single();
  if (error || !reservation) return NextResponse.json({ error: "Réservation introuvable." }, { status: 404 });
  return NextResponse.json({ reservation });
}