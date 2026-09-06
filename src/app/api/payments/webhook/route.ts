import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const raw = await request.text();
  const expected = process.env.PAYMENT_WEBHOOK_SECRET;
  const supplied = request.headers.get("x-webhook-secret")
    || request.headers.get("x-maishapay-secret")
    || request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!expected || !supplied || supplied !== expected) return NextResponse.json({ error: "Webhook non autorisé." }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Payload webhook invalide." }, { status: 400 });
  }

  const data = (body.data as Record<string, unknown> | undefined) || {};
  const reference = String(body.transactionReference || body.externalReference || body.reference || data.transactionReference || data.reference || "");
  const rawStatus = body.status || body.transactionStatus || body.state || data.status || data.transactionStatus;
  const status = String(rawStatus || "").toLowerCase();
  const amount = Number(body.amount || body.order && (body.order as Record<string, unknown>).amount || data.amount || data.order && (data.order as Record<string, unknown>).amount);
  const providerStatus = ["success", "successful", "succeeded", "paid", "completed"].includes(status) ? "succeeded"
    : ["failed", "cancelled", "canceled", "refused"].includes(status) ? "failed" : status;
  if (!reference || !providerStatus || !Number.isFinite(amount)) return NextResponse.json({ error: "Données webhook incomplètes." }, { status: 400 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: "Supabase n'est pas configuré." }, { status: 503 });
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: result, error } = await supabase.rpc("process_kivuport_payment_webhook", {
    p_external_reference: reference,
    p_provider_status: providerStatus,
    p_amount: amount,
    p_metadata: body,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 409 });
  return NextResponse.json({ success: true, result });
}
