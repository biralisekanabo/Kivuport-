import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function clientFor(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !url || !key) return null;
  return createClient(url, key, { global: { headers: { Authorization: `Bearer ${token}` } } });
}

export async function GET(request: Request) {
  const supabase = clientFor(request);
  if (!supabase) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { data: user } = await supabase.auth.getUser();
  if (!user.user?.email) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { data, error } = await supabase.from("kivuport_notifications").select("id, title, message, kind, reservation_id, read_at, archived_at, created_at").eq("recipient_email", user.user.email).is("archived_at", null).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ notifications: data ?? [] });
}

export async function PATCH(request: Request) {
  const supabase = clientFor(request);
  if (!supabase) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const body = await request.json().catch(() => null) as { id?: number } | null;
  if (!body?.id || !Number.isInteger(body.id)) return NextResponse.json({ error: "Notification id is required." }, { status: 400 });
  const { error } = await supabase.rpc("mark_kivuport_notification_read", { p_notification_id: body.id });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
