// The JWT is stored in two places: localStorage (read by client-side axios
// calls) and a cookie (read by server-side axios calls made from inside
// TanStack Start `createServerFn` handlers, where localStorage doesn't exist).
// See api.ts for how each side is consumed.
const COOKIE_NAME = "a2r_token";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24; // 1 day, matches JWT_EXPIRES_IN default

export function setAuthToken(token: string) {
  localStorage.setItem("token", token);
  document.cookie = `${COOKIE_NAME}=${token}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
}

export function clearAuthToken() {
  localStorage.removeItem("token");
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
}

export function getAuthToken(): string | null {
  return localStorage.getItem("token");
}

export const AUTH_COOKIE_NAME = COOKIE_NAME;
