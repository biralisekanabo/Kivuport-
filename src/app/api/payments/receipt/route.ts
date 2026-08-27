// app/api/payments/receipt/route.ts
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token requis" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Supabase n'est pas configuré." }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from("reservations")
    .select(`
      id,
      prix_total,
      date_reservation,
      client:client(nom, prenom, email, telephone),
      voyage:voyages(code_voyage),
      paiements:paiements(montant, mode_paiement, date_paiement, reference)
    `)
    .eq("token_paiement", token)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
  }

  // Pour l'instant, retourner les données (plus tard, générer un PDF)
  const client = (data.client as { nom?: string; prenom?: string; email?: string; telephone?: string } | null);
  const voyage = (data.voyage as { code_voyage?: string } | null);
  return NextResponse.json({
    reference: `KP-${String(data.id).padStart(4, "0")}`,
    client: `${client?.prenom || ""} ${client?.nom || ""}`.trim(),
    email: client?.email || "",
    telephone: client?.telephone || "",
    destination: voyage?.code_voyage || "",
    amount: data.prix_total,
    date: new Date(data.date_reservation).toLocaleDateString("fr-FR"),
    payment: data.paiements?.[0] || null,
  });
}
