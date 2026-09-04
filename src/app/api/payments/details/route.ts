import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Token requis' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  let reservationId: number | null = null;

  // 1. Essayer par token_paiement (flux client)
  const { data: byToken } = await supabase
    .from('reservations')
    .select('id')
    .eq('token_paiement', token)
    .single();

  if (byToken) {
    reservationId = byToken.id;
  } else {
    // 2. Essayer par external_reference dans payment_transactions (flux email)
    const { data: byRef } = await supabase
      .from('payment_transactions')
      .select('idpaiement')
      .eq('external_reference', token)
      .single();

    if (byRef) {
      const { data: paiement } = await supabase
        .from('paiements')
        .select('idreservation')
        .eq('id', byRef.idpaiement)
        .single();
      if (paiement) {
        reservationId = paiement.idreservation;
      }
    }
  }

  if (!reservationId) {
    return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 });
  }

  const { data, error } = await supabase
    .from('reservations')
    .select(`
      id,
      prix_total,
      statut,
      tentative_paiement,
      token_expire_at,
      client:client(nom, prenom, email, telephone),
      voyage:voyages(code_voyage)
    `)
    .eq('id', reservationId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 });
  }

  if (data.statut === 'arrive') {
    return NextResponse.json({
      ...data,
      alreadyPaid: true,
      message: 'Cette réservation est déjà payée.'
    });
  }

  if (data.token_expire_at && new Date() > new Date(data.token_expire_at)) {
    return NextResponse.json({
      ...data,
      expired: true,
      message: 'Ce lien de paiement a expiré (24h).'
    });
  }

  const voyage = (data.voyage as { code_voyage?: string } | null);
  const client = (data.client as { nom?: string; prenom?: string; email?: string; telephone?: string } | null);

  return NextResponse.json({
    id: data.id,
    amount: data.prix_total || 0,
    reference: `KP-${String(data.id).padStart(4, '0')}`,
    destination: voyage?.code_voyage || 'Goma - Bukavu',
    client_name: `${client?.prenom || ''} ${client?.nom || ''}`.trim() || 'Client',
    client_email: client?.email || 'client@email.com',
    client_phone: client?.telephone || '',
    statut: data.statut,
    attempts: data.tentative_paiement || 0,
    token_expire_at: data.token_expire_at,
  });
}
