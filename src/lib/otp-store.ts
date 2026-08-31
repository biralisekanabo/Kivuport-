import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const TTL_MS = 5 * 60 * 1000;

function supabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase OTP storage is not configured.");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function hashCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export async function storeOtp(email: string, code: string, ttlMs = TTL_MS) {
  const emailKey = email.toLowerCase();
  const client = supabase();
  await client.from("kivuport_otp").upsert(
    {
      email: emailKey,
      code_hash: hashCode(code),
      expires_at: new Date(Date.now() + ttlMs).toISOString(),
      attempts: 0,
    },
    { onConflict: "email" }
  );
}

export async function checkOtp(email: string, code: string): Promise<boolean> {
  const emailKey = email.toLowerCase();
  const client = supabase();
  const { data, error } = await client
    .from("kivuport_otp")
    .select("code_hash, expires_at, attempts")
    .eq("email", emailKey)
    .single();

  if (error || !data) return false;

  const now = new Date();
  const expiresAt = new Date(data.expires_at);
  if (expiresAt.getTime() < now.getTime()) {
    await client.from("kivuport_otp").delete().eq("email", emailKey);
    return false;
  }

  const matches = typeof data.code_hash === "string" && data.code_hash === hashCode(code);
  if (!matches) {
    await client
      .from("kivuport_otp")
      .update({ attempts: (data.attempts || 0) + 1 })
      .eq("email", emailKey);
  }
  return matches;
}

export async function consumeOtp(email: string, code: string): Promise<boolean> {
  const emailKey = email.toLowerCase();
  const client = supabase();
  const { data, error } = await client
    .from("kivuport_otp")
    .select("code_hash, expires_at")
    .eq("email", emailKey)
    .single();

  if (error || !data) return false;

  const expiresAt = new Date(data.expires_at);
  if (expiresAt.getTime() < new Date().getTime()) {
    await client.from("kivuport_otp").delete().eq("email", emailKey);
    return false;
  }

  if (typeof data.code_hash !== "string" || data.code_hash !== hashCode(code)) {
    return false;
  }

  await client.from("kivuport_otp").delete().eq("email", emailKey);
  return true;
}

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
