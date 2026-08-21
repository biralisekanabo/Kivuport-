import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminEmail } from "@/lib/admin";

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !url || !key) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const supabase = createClient(url, key, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !isAdminEmail(authData.user?.email)) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  const body = await request.json().catch(() => null) as { paymentId?: number; amount?: number; reason?: string } | null;
  if (!body?.paymentId || !body.amount || !body.reason?.trim()) return NextResponse.json({ error: "paymentId, amount and reason are required." }, { status: 400 });
  const { data, error } = await supabase.rpc("request_kivuport_refund", { p_payment_id: body.paymentId, p_amount: body.amount, p_reason: body.reason.trim() });
  if (error) return NextResponse.json({ error: error.message }, { status: 409 });
  return NextResponse.json({ success: true, refund: data });
}
