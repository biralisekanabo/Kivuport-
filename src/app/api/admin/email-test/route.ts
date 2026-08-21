import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminEmail } from "@/lib/admin";
import { sendBrevoEmail } from "@/lib/brevo";

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;
  const recipient = (await request.json().catch(() => null))?.email;

  if (!token || typeof recipient !== "string") {
    return NextResponse.json({ error: "Authorization and recipient email are required." }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !isAdminEmail(data.user?.email)) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  try {
    const result = await sendBrevoEmail({
      to: [{ email: recipient }],
      subject: "Test email KivuPort",
      textContent: "La configuration Brevo de KivuPort fonctionne.",
      htmlContent: "<h2>KivuPort</h2><p>La configuration Brevo fonctionne correctement.</p>",
    });
    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Brevo email failed." }, { status: 502 });
  }
}