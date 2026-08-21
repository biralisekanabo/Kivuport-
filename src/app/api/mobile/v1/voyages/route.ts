import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !url || !key) return NextResponse.json({ error: "Bearer token required." }, { status: 401 });
  const supabase = createClient(url, key, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: user, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { data, error } = await supabase.from("voyages").select("id, code_voyage, description, statut, date_depart, idbateau, bateau:bateaux(id, nom)").eq("statut", "prevu").order("date_depart");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] }, { headers: { "Cache-Control": "private, max-age=30" } });
}
