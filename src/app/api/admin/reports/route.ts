import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminEmail } from "@/lib/admin";

export async function GET(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !url || !key) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const supabase = createClient(url, key, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: auth } = await supabase.auth.getUser(token);
  if (!isAdminEmail(auth.user?.email)) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  const { data, error } = await supabase.from("kivuport_revenue_report").select("day, voyage_id, pavillon_id, payments_count, revenue").order("day", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const csv = ["jour,voyage_id,pavillon_id,paiements,chiffre_affaires", ...(data || []).map((row) => [row.day, row.voyage_id, row.pavillon_id, row.payments_count, row.revenue].join(","))].join("\n");
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=kivuport-revenue-report.csv" } });
}
