import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { consumeOtp } from "@/lib/otp-store";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email: unknown = body.email;
  const code: unknown = body.code;
  const newPassword: unknown = body.newPassword;

  if (typeof email !== "string" || typeof code !== "string" || typeof newPassword !== "string") {
    return NextResponse.json({ error: "Paramètres manquants." }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ error: "Adresse email invalide." }, { status: 400 });
  }

  if (!/^\d{6}$/.test(code.trim())) {
    return NextResponse.json({ error: "Le code doit contenir 6 chiffres." }, { status: 400 });
  }

  if (newPassword.length < 6) {
    return NextResponse.json({ error: "Le mot de passe doit contenir au moins 6 caractères." }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!(await consumeOtp(normalizedEmail, code.trim()))) {
    return NextResponse.json({ error: "Code invalide ou expiré. Veuillez demander un nouveau code." }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const { data: listData } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const user = listData?.users?.find((u) => u.email?.toLowerCase() === normalizedEmail);

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé." }, { status: 404 });
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
      password: newPassword,
    });

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Mot de passe mis à jour avec succès." });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur lors de la mise à jour du mot de passe." },
      { status: 502 }
    );
  }
}
