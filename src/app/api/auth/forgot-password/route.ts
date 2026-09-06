import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendBrevoEmail } from "@/lib/brevo";
import { storeOtp, generateOtp } from "@/lib/otp-store";
import { otpEmail } from "@/lib/email-templates";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email: unknown = body.email;

  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ error: "Veuillez saisir une adresse email valide." }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Le service de données n'est pas configuré." }, { status: 500 });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const normalizedEmail = email.trim().toLowerCase();

    let userExists = false;
    let page = 1;
    do {
      const { data: pageData, error: pageError } = await admin.auth.admin.listUsers({
        page,
        perPage: 1000,
      });
      if (pageError) {
        return NextResponse.json(
          { error: `Impossible de vérifier le compte: ${pageError.message}` },
          { status: 502 }
        );
      }

      const users = pageData?.users || [];
      userExists = users.some((user) => user.email?.toLowerCase() === normalizedEmail);
      if (userExists || users.length < 1000) break;
      page += 1;
    } while (page <= 100);

    if (!userExists) {
      return NextResponse.json({ success: true });
    }

    const code = generateOtp();
    await storeOtp(normalizedEmail, code);

    await sendBrevoEmail({
      to: [{ email: normalizedEmail }],
      subject: `Votre code de vérification KivuPort : ${code}`,
      textContent:
        `Votre code de vérification est : ${code}\n\n` +
        `Ce code est valable pendant 60 secondes.\n\n` +
        `Si vous n'avez pas demandé la réinitialisation de votre mot de passe, ignorez cet email.\n\n` +
        `KivuPort — Port de Goma`,
      htmlContent: otpEmail(code),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur lors de l'envoi du code." },
      { status: 502 }
    );
  }
}
