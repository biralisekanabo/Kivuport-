import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminEmail } from "@/lib/admin";

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !url || !key) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const supabase = createClient(url, key, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: auth } = await supabase.auth.getUser(token);
  if (!isAdminEmail(auth.user?.email)) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  const body = await request.json().catch(() => null) as { voyageId?: number; title?: string; message?: string; newDeparture?: string } | null;
  if (!body?.voyageId || !body.title?.trim() || !body.message?.trim()) return NextResponse.json({ error: "voyageId, title and message are required." }, { status: 400 });
  const { data, error } = await supabase.from("kivuport_incidents").insert({ voyage_id: body.voyageId, title: body.title.trim(), message: body.message.trim(), new_departure: body.newDeparture || null, created_by: auth.user?.email }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 409 });
  return NextResponse.json({ incident: data }, { status: 201 });
}
