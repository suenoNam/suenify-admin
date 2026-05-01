export const ADMIN_AUTH_COOKIE = "suenify_admin_auth";

export function getAdminPasswordFromEnv(): string {
  return process.env.ADMIN_PASSWORD ?? "";
}