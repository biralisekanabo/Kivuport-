import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type PaymentRequest = {
  token?: string;
  method?: string;
  phone?: string;
};

function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("243")) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 10) return `+243${digits.slice(1)}`;
  return digits.length >= 9 ? `+243${digits}` : "";
}

function detectProvider(phone: string): string {
  const digits = phone.replace(/\D/g, "").replace(/^243/, "0");
  if (/^0(97|98|99)/.test(digits)) return "AIRTEL";
  if (/^0(84|85|86|87|88|89)/.test(digits)) return "ORANGE";
  if (/^0(81|82)/.test(digits)) return "VODACOM";
  return "AIRTEL";
}

function merchantPhone(provider: string): string {
  if (provider === "VODACOM") {
    return process.env.MAISHA_VODACOM_MERCHANT_PHONE || "0822473655";
  }

  return process.env.MAISHA_AIRTEL_MERCHANT_PHONE
    || process.env.MAISHA_MERCHANT_PHONE
    || "0977241669";
}

export async function POST(request: Request) {
  let body: PaymentRequest;

  try {
    body = (await request.json()) as PaymentRequest;
  } catch {
    return NextResponse.json({ error: "Payload JSON invalide." }, { status: 400 });
  }

  const token = String(body.token ?? "").trim();
  const method = String(body.method ?? "").trim();

  if (!token || !method) {
    return NextResponse.json({ error: "Le token et la méthode de paiement sont requis." }, { status: 400 });
  }

  if (method !== "maisha_pay") {
    return NextResponse.json({ error: "Méthode de paiement non prise en charge." }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "La configuration du paiement est incomplète." }, { status: 503 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let reservationId: number | null = null;
  let paymentId: number | null = null;
  let externalReference: string | null = null;
  let paymentAmount = 0;
  let clientPhone = "";

  const { data: byToken } = await supabase
    .from("reservations")
    .select("id, statut, prix_total, token_expire_at, token_paiement, client:client(telephone, email)")
    .eq("token_paiement", token)
    .maybeSingle();

  if (byToken) {
    reservationId = byToken.id;
    paymentAmount = Number(byToken.prix_total ?? 0);
    clientPhone = normalizePhone((byToken.client as { telephone?: string } | null)?.telephone ?? "");
    const { data: payment } = await supabase
      .from("paiements")
      .select("id")
      .eq("idreservation", reservationId)
      .eq("statut", "en_attente")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    paymentId = payment?.id ?? null;

    const { data: transaction } = await supabase
      .from("payment_transactions")
      .select("external_reference")
      .eq("idpaiement", paymentId ?? 0)
      .maybeSingle();

    externalReference = transaction?.external_reference ?? null;
  } else {
    const { data: tx } = await supabase
      .from("payment_transactions")
      .select("idpaiement, external_reference")
      .eq("external_reference", token)
      .maybeSingle();

    if (tx) {
      paymentId = tx.idpaiement;
      externalReference = tx.external_reference;

      const { data: payment } = await supabase
        .from("paiements")
        .select("idreservation, montant, statut")
        .eq("id", tx.idpaiement)
        .maybeSingle();

      if (payment) {
        reservationId = payment.idreservation;
        paymentAmount = Number(payment.montant ?? 0);
      }

      const { data: reservation } = await supabase
        .from("reservations")
        .select("id, statut, prix_total, token_expire_at, client:client(telephone, email)")
        .eq("id", reservationId)
        .maybeSingle();

      if (reservation) {
        clientPhone = normalizePhone((reservation.client as { telephone?: string } | null)?.telephone ?? "");
        paymentAmount = Number(reservation.prix_total ?? paymentAmount ?? 0);
      }
    }
  }

  if (!reservationId || !paymentId) {
    return NextResponse.json({ error: "Lien de paiement invalide ou réservation introuvable." }, { status: 404 });
  }

  const reservation = await supabase
    .from("reservations")
    .select("statut, prix_total, token_expire_at, client:client(telephone, email, nom, prenom)")
    .eq("id", reservationId)
    .single();

  const reservationData = reservation.data as {
    statut?: string;
    prix_total?: number | string;
    token_expire_at?: string | null;
    client?: { telephone?: string | null; email?: string | null; nom?: string | null; prenom?: string | null } | null;
  } | null;

  if (!reservationData) {
    return NextResponse.json({ error: "Réservation introuvable." }, { status: 404 });
  }

  if (reservationData.statut === "arrive") {
    return NextResponse.json({ success: true, alreadyPaid: true, reference: externalReference ?? token, amount: Number(reservationData.prix_total ?? paymentAmount ?? 0) });
  }

  if (reservationData.token_expire_at && new Date() > new Date(reservationData.token_expire_at)) {
    return NextResponse.json({ error: "Ce lien de paiement a expiré." }, { status: 410 });
  }

  const finalPhone = normalizePhone(body.phone ?? (reservationData.client?.telephone ?? ""));
  if (!finalPhone) {
    return NextResponse.json({ error: "Aucun numéro de téléphone valide n'est enregistré pour ce client." }, { status: 422 });
  }

  clientPhone = finalPhone;
  paymentAmount = Number(reservationData.prix_total ?? paymentAmount ?? 0);

  if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
    return NextResponse.json({ error: "Le montant du paiement est invalide." }, { status: 400 });
  }

  if (!externalReference) {
    externalReference = `KP-${String(reservationId).padStart(4, "0")}-${Date.now()}`;
    const { error: txError } = await supabase.from("payment_transactions").upsert(
      {
        idpaiement: paymentId,
        external_reference: externalReference,
        provider: "maisha_pay",
        provider_status: "pending",
        metadata: {},
      },
      { onConflict: "idpaiement" }
    );

    if (txError) {
      return NextResponse.json({ error: txError.message || "Impossible d'enregistrer la référence de paiement." }, { status: 409 });
    }
  }

  const apiUrl = process.env.MAISHA_API_URL;
  const apiKey = process.env.MAISHA_API_KEY;
  const apiSecret = process.env.MAISHA_API_SECRET;

  if (apiUrl && apiKey && apiSecret) {
    try {
      const provider = detectProvider(clientPhone);
      const providerResponse = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transactionReference: externalReference,
          gatewayMode: process.env.MAISHA_GATEWAY_MODE ?? "1",
          publicApiKey: apiKey,
          secretApiKey: apiSecret,
          order: {
            amount: paymentAmount,
            currency: "CDF",
            customerFullName: [reservationData.client?.prenom, reservationData.client?.nom].filter(Boolean).join(" ") || "KivuPort Client",
            customerEmailAdress: reservationData.client?.email || "client@kivuport.com",
          },
          paymentChannel: {
            channel: "MOBILEMONEY",
            provider,
            // MaishaPay expects the customer's wallet in international format.
            walletID: clientPhone,
            merchantWalletID: merchantPhone(provider),
          },
        }),
      });

      if (!providerResponse.ok) {
        const providerText = await providerResponse.text();
        console.error("MaishaPay request failed:", providerText);
        return NextResponse.json(
          {
            error: "La demande de paiement MaishaPay a échoué.",
            providerStatus: providerResponse.status,
            providerDetails: providerText.slice(0, 500),
          },
          { status: 502 }
        );
      }

      const payload = (await providerResponse.json().catch(() => ({}))) as { status?: string; reference?: string };
      await supabase
        .from("payment_transactions")
        .update({
          provider_status: String(payload.status ?? "pending").toLowerCase(),
          metadata: { ...(payload as Record<string, unknown>), phone: clientPhone },
          updated_at: new Date().toISOString(),
        })
        .eq("idpaiement", paymentId);
    } catch (error) {
      console.error("❌ MaishaPay call failed:", error);
      return NextResponse.json({ error: "Le fournisseur de paiement n'est pas disponible pour le moment." }, { status: 502 });
    }
  }

  return NextResponse.json({
    success: true,
    alreadyPaid: false,
    reference: externalReference,
    amount: paymentAmount,
    status: "pending",
    provider: "maisha_pay",
    phone: clientPhone,
  });
}