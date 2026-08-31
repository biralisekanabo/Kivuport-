type OtpEntry = { code: string; expiresAt: number };

const otpStore = new Map<string, OtpEntry>();

export function storeOtp(email: string, code: string, ttlMs = 60 * 1000) {
  otpStore.set(email.toLowerCase(), { code, expiresAt: Date.now() + ttlMs });
}

export function checkOtp(email: string, code: string): boolean {
  const entry = otpStore.get(email.toLowerCase());
  if (!entry) return false;
  return entry.expiresAt >= Date.now() && entry.code === code;
}

export function consumeOtp(email: string, code: string): boolean {
  const emailKey = email.toLowerCase();
  const entry = otpStore.get(emailKey);
  if (!entry) return false;
  otpStore.delete(emailKey);
  return entry.expiresAt >= Date.now() && entry.code === code;
}

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
