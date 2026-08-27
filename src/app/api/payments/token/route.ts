// app/api/payments/token/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type PaymentMethod = "maisha_pay" | "orange_money" | "vodacom" | "airtel_money" | "card";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, method, phone } = body;

    console.log("📝 Paiement reçu:", { token, method, phone });

    if (!token) {
      return NextResponse.json({ error: "Token requis" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    // Trouver la réservation
    const { data: reservation, error: findError } = await supabase
      .from('reservations')
      .select('id, prix_total, statut, tentative_paiement, token_expire_at')
      .eq('token_paiement', token)
      .single();

    if (findError || !reservation) {
      return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
    }

    // Vérifier si déjà payée
    if (reservation.statut === 'arrive') {
      return NextResponse.json({ 
        alreadyPaid: true,
        message: "Cette réservation est déjà payée."
      });
    }

    // Vérifier l'expiration
    if (reservation.token_expire_at && new Date() > new Date(reservation.token_expire_at)) {
      return NextResponse.json({ error: "Le lien de paiement a expiré (24h)" }, { status: 400 });
    }

    // Valider la méthode
    const validMethods = ["maisha_pay", "orange_money", "vodacom", "airtel_money", "card"];
    if (!method || !validMethods.includes(method)) {
      return NextResponse.json({ error: "Méthode de paiement invalide" }, { status: 400 });
    }

    // Valider le téléphone
    const isMobileMoney = ["maisha_pay", "orange_money", "vodacom", "airtel_money"].includes(method);
    if (isMobileMoney) {
      const cleaned = phone?.replace(/\s/g, '') || '';
      const isValid = (cleaned.startsWith('243') && cleaned.length === 12) || 
                      (cleaned.startsWith('0') && cleaned.length === 10);
      if (!isValid) {
        return NextResponse.json({ error: "Numéro de téléphone invalide" }, { status: 400 });
      }
    }

    // SIMULER LE PAIEMENT (à remplacer par un vrai système)
    // Pour le test, on considère que le paiement est réussi
    const paymentSuccess = true;

    if (!paymentSuccess) {
      await supabase
        .from('reservations')
        .update({ tentative_paiement: (reservation.tentative_paiement || 0) + 1 })
        .eq('id', reservation.id);

      return NextResponse.json({ error: "Le paiement a échoué" }, { status: 400 });
    }

    // Enregistrer le paiement
    const { data: payment, error: paymentError } = await supabase
      .from('paiements')
      .insert({
        idreservation: reservation.id,
        montant: reservation.prix_total,
        devise: 'FC',
        mode_paiement: method,
        date_paiement: new Date().toISOString(),
        statut: 'paye',
        telephone: phone || null,
      })
      .select()
      .single();

    if (paymentError) {
      console.error("❌ Erreur enregistrement paiement:", paymentError);
      return NextResponse.json({ 
        error: "Erreur lors de l'enregistrement du paiement" 
      }, { status: 500 });
    }

    // Mettre à jour la réservation
    await supabase
      .from('reservations')
      .update({
        statut: 'arrive',
        token_paiement: null,
        token_expire_at: null,
        tentative_paiement: 0,
      })
      .eq('id', reservation.id);

    console.log("✅ Paiement réussi pour la réservation:", reservation.id);

    return NextResponse.json({
      success: true,
      reservationId: reservation.id,
      reference: `KP-${String(reservation.id).padStart(4, '0')}`,
      amount: reservation.prix_total,
      paymentId: payment.id,
      message: "Paiement effectué avec succès !"
    });

  } catch (error) {
    console.error("❌ Erreur paiement:", error);
    return NextResponse.json({ 
      error: "Une erreur inattendue est survenue" 
    }, { status: 500 });
  }
}