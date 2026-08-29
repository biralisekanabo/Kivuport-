import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendBrevoEmail } from "@/lib/brevo";

function emailTemplate({ link, appUrl, recipient }: { link: string; appUrl: string; recipient: string }) {
  const linkDomain = (() => {
    try {
      return new URL(link).hostname;
    } catch {
      return "";
    }
  })();

  return (
    `<!DOCTYPE html>` +
    `<html lang="fr">` +
    `<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">` +
    `<title>Réinitialisation de votre mot de passe KivuPort</title></head>` +
    `<body style="margin:0;padding:0;background-color:#eef2f7;font-family:'Segoe UI',Arial,Helvetica,sans-serif;color:#182238;">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eef2f7;padding:32px 16px;">` +
    `<tr><td align="center">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 18px 40px rgba(24,34,56,0.08);">` +

    // EN-TÊTE
    `<tr><td style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:28px 32px;text-align:center;">` +
    `<div style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">⛴</div>` +
    `<div style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:0.5px;margin-top:6px;">KivuPort</div>` +
    `<div style="font-size:12px;color:#bfdbfe;margin-top:4px;letter-spacing:1px;">PORT · GOMA</div>` +
    `</td></tr>` +

    // CORPS
    `<tr><td style="padding:32px;">` +
    `<div style="font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Sécurité du compte</div>` +
    `<h1 style="font-size:22px;font-weight:700;color:#182238;margin:8px 0 16px;line-height:1.3;">Réinitialisation de votre mot de passe</h1>` +
    `<p style="font-size:15px;line-height:1.65;color:#334155;margin:0 0 12px;">Bonjour,</p>` +
    `<p style="font-size:15px;line-height:1.65;color:#334155;margin:0 0 8px;">` +
    `Nous avons reçu une demande de réinitialisation pour votre compte KivuPort. ` +
    `<strong>Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email</strong> : votre mot de passe actuel restera inchangé.` +
    `</p>` +
    `<p style="font-size:15px;line-height:1.65;color:#334155;margin:0 0 26px;">Pour continuer, cliquez sur le bouton ci-dessous :</p>` +

    // BOUTON
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:4px 0 8px;">` +
    `<a href="${link}" style="display:inline-block;background-color:#2563eb;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 34px;border-radius:10px;">` +
    `Réinitialiser mon mot de passe` +
    `</a>` +
    `</td></tr></table>` +
    `<p style="font-size:13px;color:#94a3b8;text-align:center;margin:6px 0 28px;">Ce lien est valable pour une durée limitée.</p>` +

    // LIEN ALTERNATIF
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;"><tr><td style="padding:14px 16px;">` +
    `<div style="font-size:12px;color:#64748b;margin-bottom:6px;">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :</div>` +
    `<div style="font-size:12px;color:#2563eb;word-break:break-all;line-height:1.5;">${link}</div>` +
    `</td></tr></table>` +

    // CONFIDENTIALITÉ
    `<div style="display:flex;align-items:center;gap:8px;background-color:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:12px 16px;margin-top:26px;">` +
    `<div style="width:24px;height:24px;border-radius:50%;background-color:#dbeafe;text-align:center;line-height:24px;color:#2563eb;font-size:13px;font-weight:700;">&#128274;</div>` +
    `<div style="font-size:12px;color:#1e3a8a;line-height:1.5;">Cet email vous est adressé car une demande de réinitialisation a été faite pour votre compte. Si vous n'êtes pas à l'origine de cette demande, contactez-nous immédiatement.</div>` +
    `</div>` +
    `</td></tr>` +

    // PIED DE PAGE
    `<tr><td style="background-color:#f8fafc;padding:22px 32px;text-align:center;border-top:1px solid #eef2f7;">` +
    `<div style="font-size:13px;font-weight:700;color:#182238;">KivuPort — Port de Goma</div>` +
    `<div style="font-size:12px;color:#94a3b8;margin-top:4px;">${recipient}</div>` +
    `${appUrl ? `<div style="font-size:12px;color:#64748b;margin-top:10px;"><a href="${appUrl}" style="color:#2563eb;text-decoration:none;">${appUrl}</a></div>` : ""}` +
    `<div style="font-size:12px;color:#94a3b8;margin-top:10px;">Cet email a été envoyé de manière sécurisée par KivuPort. Merci de ne pas y répondre.${linkDomain ? ` · ${linkDomain}` : ""}</div>` +
    `</td></tr>` +

    `</table>` +
    `<div style="font-size:11px;color:#94a3b8;text-align:center;margin-top:18px;">© ${new Date().getFullYear()} KivuPort. Tous droits réservés.</div>` +
    `</td></tr></table>` +
    `</body></html>`
  );
}

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
        `Nous avons bien reçu votre demande de réinitialisation de mot de passe pour votre compte KivuPort.\n\n` +
        `Pour protéger votre compte, ce lien est valable uniquement pour une durée limitée. Cliquez sur le lien ci-dessous pour choisir un nouveau mot de passe :\n\n` +
        `${link}\n\n` +
        `Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur.\n\n` +
        `Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email en toute sécurité. Votre mot de passe actuel restera inchangé.\n\n` +
        `Cordialement,\nL'équipe KivuPort`,
      htmlContent: emailTemplate({ link, appUrl, recipient: email.trim() }),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur lors de l'envoi de l'email." },
      { status: 502 }
    );
  }
}
