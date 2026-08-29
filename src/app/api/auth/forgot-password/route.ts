import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendBrevoEmail } from "@/lib/brevo";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email: unknown = body.email;
  const origin: unknown = body.origin;

  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ error: "Veuillez saisir une adresse email valide." }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const base = typeof origin === "string" && origin ? origin.replace(/\/$/, "") : (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
  const redirectTo = `${base}/reset-password`;

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: email.trim(),
      options: { redirectTo },
    });

    if (error) {
      if (/user.*not.*found/i.test(error.message) || error.message === "User not found") {
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const link = data?.properties?.action_link;
    if (!link) {
      return NextResponse.json({ error: "Impossible de générer le lien de réinitialisation." }, { status: 500 });
    }

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");

    await sendBrevoEmail({
      to: [{ email: email.trim() }],
      subject: "Réinitialisation de votre mot de passe KivuPort",
      textContent:
        `Bonjour,\n\n` +
        `Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte KivuPort.\n\n` +
        `Cliquez sur le lien ci-dessous pour choisir un nouveau mot de passe :\n${link}\n\n` +
        `Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email.\n\n` +
        `Cordialement,\nL'équipe KivuPort`,
      htmlContent:
        `<div style="font-family:Arial,Helvetica,sans-serif;color:#182238;max-width:520px;margin:0 auto;">` +
          `<div style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:20px 24px;border-radius:12px 12px 0 0;">` +
            `<span style="color:#fff;font-size:18px;font-weight:700;">KivuPort</span>` +
          `</div>` +
          `<div style="border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:24px;">` +
            `<h2 style="margin:0 0 12px;">Réinitialisation de votre mot de passe</h2>` +
            `<p style="line-height:1.6;color:#4b5563;">Bonjour,</p>` +
            `<p style="line-height:1.6;color:#4b5563;">Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte KivuPort. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.</p>` +
            `<p style="text-align:center;margin:28px 0;">` +
              `<a href="${link}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;">Réinitialiser mon mot de passe</a>` +
            `</p>` +
            `<p style="font-size:13px;color:#9ca3af;line-height:1.5;">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br/><a href="${link}" style="color:#2563eb;">${link}</a></p>` +
            `<p style="font-size:13px;color:#9ca3af;margin-top:20px;">Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email. Ce lien expirera prochainement.</p>` +
            `<p style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;">Cordialement,<br/>L'équipe KivuPort${appUrl ? ` · <a href="${appUrl}" style="color:#2563eb;">${appUrl}</a>` : ""}</p>` +
          `</div>` +
        `</div>`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur lors de l'envoi de l'email." },
      { status: 502 }
    );
  }
}
