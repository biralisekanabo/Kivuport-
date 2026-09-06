// api/payments/webhook/route.ts
import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type PaymentWebhook = {
  externalReference?: unknown;
  status?: unknown;
  amount?: unknown;
  transactionReference?: unknown;
  originatingTransactionId?: unknown;
  transactionStatus?: unknown;
  order?: { amount?: unknown };
  metadata?: unknown;
};

function validSignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  try {
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
    const received = Buffer.from(signature, "hex");
    const expectedBytes = Buffer.from(expected, "hex");
    return received.length === expectedBytes.length && timingSafeEqual(received, expectedBytes);
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const secret = process.env.MAISHA_WEBHOOK_SECRET;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  if (!serviceRoleKey || !supabaseUrl) {
    return NextResponse.json({ error: "Payment webhook is not configured." }, { status: 503 });
  }

  const rawBody = await request.text();

  // Vérification de la signature (optionnelle)
  if (secret) {
    const signature = request.headers.get("x-payment-signature") || request.headers.get("x-hub-signature-256");
    if (signature && !validSignature(rawBody, signature, secret)) {
      return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
    }
  }

  let body: PaymentWebhook;
  try {
    body = JSON.parse(rawBody) as PaymentWebhook;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  // Extraction des données
  const externalReference = [body.externalReference, body.transactionReference, body.originatingTransactionId]
    .find((value): value is string => typeof value === "string" && value.length > 0);
  
  const providerStatus = body.status || body.transactionStatus;
  const rawAmount = body.amount ?? body.order?.amount;
  const amount = typeof rawAmount === "number" ? rawAmount : typeof rawAmount === "string" ? Number(rawAmount) : NaN;

  if (!externalReference || typeof providerStatus !== "string" || !Number.isFinite(amount)) {
    console.error("❌ Données manquantes:", { externalReference, providerStatus, amount });
    return NextResponse.json({ error: "A payment reference, status and numeric amount are required." }, { status: 400 });
  }

  // ✅ Vérifier que c'est bien une transaction de kivuport (préfixe KP-)
  if (!externalReference.startsWith("KP-")) {
    console.log(`⚠️ Transaction ignorée (projet différent): ${externalReference}`);
    return NextResponse.json({ success: true, ignored: true, reason: "not_kivuport_project" });
  }

  console.log(`✅ Webhook reçu pour kivuport: ${externalReference}, status: ${providerStatus}`);

  // Créer le client Supabase
  const supabase = createClient(supabaseUrl, serviceRoleKey, { 
    auth: { persistSession: false, autoRefreshToken: false } 
  });

  try {
    // 1. Trouver la transaction dans payment_transactions
    const { data: transaction, error: transactionError } = await supabase
      .from("payment_transactions")
      .select("idpaiement")
      .eq("external_reference", externalReference)
      .single();

    if (transactionError || !transaction) {
      console.error("❌ Transaction non trouvée:", externalReference);
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // 2. Mettre à jour le statut de la transaction
    const { error: updateError } = await supabase
      .from("payment_transactions")
      .update({
        provider_status: providerStatus.toLowerCase(),
        provider_amount: amount,
        provider_metadata: body.metadata || {},
        updated_at: new Date().toISOString()
      })
      .eq("external_reference", externalReference);

    if (updateError) {
      console.error("❌ Erreur mise à jour transaction:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 409 });
    }

    // 3. Si le paiement est réussi, mettre à jour le paiement et la réservation
    if (providerStatus.toLowerCase() === "success" || providerStatus.toLowerCase() === "completed") {
      // Mettre à jour le paiement
      const { error: paiementError } = await supabase
        .from("paiements")
        .update({
          statut: "payé",
          date_paiement: new Date().toISOString(),
          reference_externe: externalReference
        })
        .eq("id", transaction.idpaiement);

      if (paiementError) {
        console.error("❌ Erreur mise à jour paiement:", paiementError);
        return NextResponse.json({ error: paiementError.message }, { status: 409 });
      }

      // Récupérer la réservation associée
      const { data: paiement } = await supabase
        .from("paiements")
        .select("idreservation")
        .eq("id", transaction.idpaiement)
        .single();

      if (paiement) {
        // Mettre à jour la réservation
        const { error: reservationError } = await supabase
          .from("reservations")
          .update({
            statut: "arrive",
            token_paiement: null,
            token_expire_at: null
          })
          .eq("id", paiement.idreservation);

        if (reservationError) {
          console.error("❌ Erreur mise à jour réservation:", reservationError);
          return NextResponse.json({ error: reservationError.message }, { status: 409 });
        }
      }
    }

    // 4. Si le paiement a échoué, incrémenter les tentatives
    if (providerStatus.toLowerCase() === "failed" || providerStatus.toLowerCase() === "cancelled") {
      const { data: paiement } = await supabase
        .from("paiements")
        .select("idreservation")
        .eq("id", transaction.idpaiement)
        .single();

      if (paiement) {
        await supabase
          .from("reservations")
          .update({
            tentative_paiement: supabase.rpc('increment_tentative', { row_id: paiement.idreservation })
          })
          .eq("id", paiement.idreservation);
      }
    }

    console.log(`✅ Webhook traité avec succès pour ${externalReference}`);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("❌ Erreur traitement webhook:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}