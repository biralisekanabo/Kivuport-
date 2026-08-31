import { NextResponse } from "next/server";
import { checkOtp } from "@/lib/otp-store";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email: unknown = body.email;
  const code: unknown = body.code;

  if (typeof email !== "string" || typeof code !== "string") {
    return NextResponse.json({ error: "Paramètres manquants." }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ error: "Adresse email invalide." }, { status: 400 });
  }

  if (!/^\d{6}$/.test(code.trim())) {
    return NextResponse.json({ error: "Le code doit contenir 6 chiffres." }, { status: 400 });
  }

  const verified = checkOtp(email.trim().toLowerCase(), code.trim());

  if (!verified) {
    return NextResponse.json({ error: "Code invalide ou expiré. Veuillez demander un nouveau code." }, { status: 400 });
  }

  return NextResponse.json({ success: true, verified: true });
}
