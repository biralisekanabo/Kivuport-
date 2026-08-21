export const ADMIN_EMAIL = "admin@portuaire.com";

export function isAdminEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() === ADMIN_EMAIL;
}