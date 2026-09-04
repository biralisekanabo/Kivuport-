import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { resolveAppUrl } from "@/lib/urls";

export const runtime = "nodejs";

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("243") ? digits : `243${digits.replace(/^0/, "")}`;
}

function detectProvider(phone: string) {
  const localNumber = phone.slice(3, 5);
  if (["81", "82", "83"].includes(localNumber)) return "MPESA";
  if (["84", "85", "89"].includes(localNumber)) return "ORANGE";
  if (["97", "98", "99"].includes(localNumber)) return "AIRTEL";
  if (["50", "51", "52", "53", "54", "55", "56", "57", "58", "59"].includes(localNumber)) return "AFRICELL";
  if (["90", "91"].includes(localNumber)) return "AFRICELL";
  return null;
}

async function findReservation(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  token: string
) {
  // 1. Par token_paiement (flux client)
  const { data: byToken } = await supabase
    .from('reservations')
    .select('id, prix_total, statut, tentative_paiement, token_expire_at, client:client(nom, prenom, email)')
    .eq('token_paiement', token)
    .single();

  if (byToken) return byToken as { id: number; prix_total: number; statut: string; tentative_paiement: number; token_expire_at: string | null; client: unknown };

  // 2. Par external_reference (flux email)
  const { data: byRef } = await supabase
    .from('payment_transactions' as never)
    .select('idpaiement')
    .eq('external_reference', token)
    .single();

  if (byRef) {
    const { data: paiement } = await supabase
      .from('paiements' as never)
      .select('idreservation')
      .eq('id', (byRef as { idpaiement: number }).idpaiement)
      .single();
    if (paiement) {
      const reservationId = (paiement as { idreservation: number }).idreservation;
      const { data: reservation } = await supabase
        .from('reservations')
        .select('id, prix_total, statut, tentative_paiement, token_expire_at, client:client(nom, prenom, email)')
        .eq('id', reservationId)
        .single();
      if (reservation) return reservation as { id: number; prix_total: number; statut: string; tentative_paiement: number; token_expire_at: string | null; client: unknown };
    }
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, method, phone } = body;

    if (!token) {
      return NextResponse.json({ error: "Token requis" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    const reservation = await findReservation(supabase, token);

    if (!reservation) {
      return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
    }

    if (reservation.statut === 'arrive') {
      return NextResponse.json({
        alreadyPaid: true,
        message: "Cette réservation est déjà payée."
      });
    }

    if (reservation.token_expire_at && new Date() > new Date(reservation.token_expire_at)) {
      return NextResponse.json({ error: "Le lien de paiement a expiré (24h)" }, { status: 400 });
    }

    if (method !== "maisha_pay") {
      return NextResponse.json({ error: "Seul MaishaPay est accepté." }, { status: 400 });
    }

    const cleaned = typeof phone === "string" ? phone.replace(/\D/g, "") : "";
    const isValidPhone = (cleaned.startsWith("243") && cleaned.length === 12) ||
      (cleaned.startsWith("0") && cleaned.length === 10);
    if (!isValidPhone) {
      return NextResponse.json({ error: "Numéro de téléphone invalide" }, { status: 400 });
    }

    const maishaApiKey = process.env.MAISHA_API_KEY;
    const maishaApiSecret = process.env.MAISHA_API_SECRET;
    const maishaApiUrl = process.env.MAISHA_API_URL;
    if (!maishaApiKey || !maishaApiSecret || !maishaApiUrl) {
      return NextResponse.json({
        error: "MaishaPay n'est pas encore configuré : les clés et l'URL API sont requis.",
      }, { status: 503 });
    }

    const normalizedPhone = normalizePhone(cleaned);
    const provider = detectProvider(normalizedPhone);
    if (!provider) {
      return NextResponse.json({ error: "Opérateur mobile non pris en charge." }, { status: 400 });
    }

    const client = reservation.client as { nom?: string; prenom?: string; email?: string } | null;
    const customerName = [client?.prenom, client?.nom].filter(Boolean).join(" ") || "Client KivuPort";
    const appUrl = resolveAppUrl(request);
    const payload = {
      transactionReference: token,
      gatewayMode: "1",
      publicApiKey: maishaApiKey,
      secretApiKey: maishaApiSecret,
      order: {
        amount: String(reservation.prix_total),
        currency: "CDF",
        customerFullName: customerName,
        customerEmailAdress: client?.email || "",
      },
      paymentChannel: {
        channel: "MOBILEMONEY",
        provider,
        walletID: `+${normalizedPhone}`,
        callbackUrl: `${appUrl}/api/payments/webhook`,
      },
    };

    const response = await fetch(maishaApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30_000),
    });
    const result = await response.json().catch(() => null);

    if (!response.ok || (result && typeof result === "object" && "errors" in result)) {
      await supabase
        .from("reservations")
        .update({ tentative_paiement: (reservation.tentative_paiement || 0) + 1 })
        .eq("id", reservation.id);
      const errorMessage = result && typeof result === "object" && "message" in result && typeof result.message === "string"
        ? result.message
        : "MaishaPay a refusé la demande de paiement.";
      return NextResponse.json({ error: errorMessage }, { status: 502 });
    }

    const responseData = result && typeof result === "object" && "data" in result ? result.data : result;
    const providerReference = responseData && typeof responseData === "object"
      ? ("transactionId" in responseData ? responseData.transactionId : "reference" in responseData ? responseData.reference : null)
      : null;

    return NextResponse.json({
      success: true,
      status: "pending",
      reference: token,
      providerReference,
      amount: reservation.prix_total,
      message: "Demande envoyée. Confirmez le paiement sur votre téléphone.",
    });

  } catch (error) {
    return NextResponse.json({
      error: "Une erreur inattendue est survenue"
    }, { status: 500 });
  }
}
