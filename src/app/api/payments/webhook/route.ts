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
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceRoleKey || !supabaseUrl) {
    return NextResponse.json({ error: "Payment webhook is not configured." }, { status: 503 });
  }

  const rawBody = await request.text();

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
  const externalReference = [body.externalReference, body.transactionReference, body.originatingTransactionId]
    .find((value): value is string => typeof value === "string" && value.length > 0);
  const providerStatus = body.status || body.transactionStatus;
  const rawAmount = body.amount ?? body.order?.amount;
  const amount = typeof rawAmount === "number" ? rawAmount : typeof rawAmount === "string" ? Number(rawAmount) : NaN;
  if (!externalReference || typeof providerStatus !== "string" || !Number.isFinite(amount)) {
    return NextResponse.json({ error: "A payment reference, status and numeric amount are required." }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await supabase.rpc("process_kivuport_payment_webhook", {
    p_external_reference: externalReference,
    p_provider_status: providerStatus.toLowerCase(),
    p_amount: amount,
    p_metadata: body.metadata && typeof body.metadata === "object" ? body.metadata : {},
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 409 });
  return NextResponse.json({ success: true, result: data?.[0] ?? null });
}
