import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("243") && digits.length >= 12) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 10) return `+243${digits.slice(1)}`;
  return "";
}

function detectProvider(phone: string): "AIRTEL" | "VODACOM" | "ORANGE" | null {
  const local = phone.replace(/\D/g, "").replace(/^243/, "0");
  if (/^0(97|98|99)/.test(local)) return "AIRTEL";
  if (/^0(81|82)/.test(local)) return "VODACOM";
  if (/^0(84|85|86|87|88|89)/.test(local)) return "ORANGE";
  return null;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { token?: string; phone?: string } | null;
  const token = body?.token?.trim();
  if (!token) return NextResponse.json({ error: "Référence de paiement requise." }, { status: 400 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: "Supabase n'est pas configuré." }, { status: 503 });
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: transaction } = await supabase.from("payment_transactions")
    .select("id, idpaiement, external_reference").eq("external_reference", token).maybeSingle();
  if (!transaction) return NextResponse.json({ error: "Référence de paiement invalide." }, { status: 404 });

  const { data: payment } = await supabase.from("paiements")
    .select("idreservation, montant, statut").eq("id", transaction.idpaiement).single();
  if (!payment) return NextResponse.json({ error: "Paiement introuvable." }, { status: 404 });
  if (payment.statut === "paye") return NextResponse.json({ success: true, alreadyPaid: true, reference: token });

  const { data: reservation } = await supabase.from("reservations")
    .select("id, statut, prix_total, client:client(nom, prenom, email, telephone)")
    .eq("id", payment.idreservation).single();
  if (!reservation) return NextResponse.json({ error: "Réservation introuvable." }, { status: 404 });
  if (reservation.statut !== "confirme") return NextResponse.json({ error: "La réservation doit être confirmée." }, { status: 409 });

  const client = reservation.client as { nom?: string; prenom?: string; email?: string; telephone?: string } | null;
  const phone = normalizePhone(body?.phone || client?.telephone || "");
  if (!phone) return NextResponse.json({ error: "Le numéro Mobile Money du client est invalide." }, { status: 422 });
  const provider = detectProvider(phone);
  if (!provider) return NextResponse.json({ error: "L'opérateur Mobile Money de ce numéro n'est pas reconnu par MaishaPay." }, { status: 422 });

  const publicKey = process.env.MAISHA_PUBLIC_API_KEY;
  const secretKey = process.env.MAISHA_API_SECRET_KEY;
  const apiUrl = process.env.MAISHA_API_URL;
  const callbackUrl = process.env.MAISHA_CALLBACK_URL;
  if (!apiUrl || !publicKey || !secretKey || !callbackUrl?.startsWith("https://")) {
    return NextResponse.json({ error: "La configuration MaishaPay live est incomplète." }, { status: 503 });
  }

  let providerResponse: Response;
  try {
    providerResponse = await fetch(apiUrl, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        transactionReference: token,
        gatewayMode: "1",
        publicApiKey: publicKey,
        secretApiKey: secretKey,
        order: {
          amount: Number(reservation.prix_total ?? payment.montant),
          currency: "CDF",
          customerFullName: [client?.prenom, client?.nom].filter(Boolean).join(" ") || "KivuPort Client",
          customerEmailAdress: client?.email || "",
        },
        paymentChannel: {
          channel: "MOBILEMONEY",
          provider,
          walletID: phone,
          callbackUrl,
        },
      }),
      signal: AbortSignal.timeout(15000),
    });
  } catch (error) {
    console.error("MaishaPay request failed before receiving a response", {
      message: error instanceof Error ? error.message : String(error),
      reference: token,
      provider,
    });
    return NextResponse.json({ error: "MaishaPay est momentanément inaccessible. Aucune demande PIN n'a été déclenchée." }, { status: 502 });
  }
  const payload = await providerResponse.json().catch(() => ({}));
  const responseData = payload.data as Record<string, unknown> | undefined;
  const providerStatus = String(payload.status || payload.transactionStatus || responseData?.status || "").toLowerCase();
  const providerAccepted = payload.success !== false && responseData?.success !== false;
  if (!providerResponse.ok) {
    const providerMessage = typeof payload.message === "string" ? payload.message : typeof payload.error === "string" ? payload.error : "";
    return NextResponse.json({ error: providerMessage || "MaishaPay a refusé la demande de paiement.", details: payload }, { status: 502 });
  }
  if (!providerAccepted || ["failed", "cancelled", "canceled", "refused", "rejected"].includes(providerStatus)) {
    return NextResponse.json({ error: typeof payload.message === "string" ? payload.message : "MaishaPay n'a pas accepté la demande de paiement.", details: payload }, { status: 502 });
  }
  if (!providerStatus && !payload.transactionId && !payload.id && !responseData?.transactionId && !responseData?.id) {
    return NextResponse.json({ error: "MaishaPay n'a pas confirmé le déclenchement de la demande PIN.", details: payload }, { status: 502 });
  }

  const { error: transactionError } = await supabase.from("payment_transactions").update({
    provider_status: providerStatus,
    metadata: { ...payload, phone, provider },
    updated_at: new Date().toISOString(),
  }).eq("id", transaction.id);
  if (transactionError) return NextResponse.json({ error: "Paiement MaishaPay envoyé, mais son suivi n'a pas pu être enregistré." }, { status: 502 });

  return NextResponse.json({ success: true, reference: token, provider, status: providerStatus, awaitingConfirmation: true });
}
