import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendBrevoEmail } from "@/lib/brevo";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!url || !serviceRoleKey) return NextResponse.json({ error: "Supabase service role is not configured." }, { status: 503 });

  const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: messages, error } = await supabase.from("kivuport_email_outbox").select("id, recipient_email, subject, html_content, text_content, attempts").eq("status", "pending").lt("attempts", 5).order("created_at", { ascending: true }).limit(25);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let sent = 0;
  for (const message of messages ?? []) {
    const attempt = Number(message.attempts || 0) + 1;
    try {
      await sendBrevoEmail({ to: [{ email: message.recipient_email }], subject: message.subject, htmlContent: message.html_content, textContent: message.text_content || undefined });
      await supabase.from("kivuport_email_outbox").update({ status: "sent", attempts: attempt, sent_at: new Date().toISOString(), last_error: null }).eq("id", message.id);
      sent += 1;
    } catch (sendError) {
      await supabase.from("kivuport_email_outbox").update({ status: attempt >= 5 ? "failed" : "pending", attempts: attempt, last_error: sendError instanceof Error ? sendError.message : "Brevo delivery failed" }).eq("id", message.id);
    }
  }
  return NextResponse.json({ processed: messages?.length ?? 0, sent });
}
