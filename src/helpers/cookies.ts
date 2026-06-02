

export const AUTH_COOKIE_KEY = "sitp_token";

const DEFAULT_EXPIRY_DAYS = 7;

export interface CookieOptions {
  /** Number of days until the cookie expires. Omit for a session cookie. */
  expiryDays?: number;
  /** Cookie path (default: "/"). */
  path?: string;
  /** SameSite attribute (default: "Lax"). */
  sameSite?: "Strict" | "Lax" | "None";
  /** Whether the cookie is HTTPS-only (default: false for dev, true for Secure). */
  secure?: boolean;
}

/**
 * Write a cookie in the browser.
 *
 * @example
 * setCookie("theme", "dark", { expiryDays: 30 });
 */
export function setCookie(
  name: string,
  value: string,
  options: CookieOptions = {}
): void {
  if (typeof document === "undefined") return; // SSR guard

  const {
    expiryDays = DEFAULT_EXPIRY_DAYS,
    path = "/",
    sameSite = "Lax",
    secure = false,
  } = options;

  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (expiryDays !== undefined) {
    const date = new Date();
    date.setTime(date.getTime() + expiryDays * 24 * 60 * 60 * 1000);
    cookieString += `; expires=${date.toUTCString()}`;
  }

  cookieString += `; path=${path}`;
  cookieString += `; SameSite=${sameSite}`;

  if (secure) {
    cookieString += "; Secure";
  }

  document.cookie = cookieString;
}

/**
 * Read a cookie value by name. Returns `null` if the cookie does not exist.
 *
 * @example
 * const theme = getCookie("theme"); // "dark" | null
 */
export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null; // SSR guard

  const encodedName = encodeURIComponent(name);
  const cookies = document.cookie.split(";");

  for (const cookie of cookies) {
    const [rawKey, ...rawValue] = cookie.trim().split("=");
    if (rawKey === encodedName) {
      return decodeURIComponent(rawValue.join("="));
    }
  }

  return null;
}

/**
 * Delete a cookie by name.
 *
 * @example
 * removeCookie("theme");
 */
export function removeCookie(name: string, path = "/"): void {
  if (typeof document === "undefined") return; // SSR guard

  // Set expiry to the past to force deletion
  document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; SameSite=Lax`;
}

/**
 * Return ALL current cookies as a `{ name: value }` record.
 *
 * @example
 * const all = getAllCookies();
 * console.log(all["theme"]); // "dark"
 */
export function getAllCookies(): Record<string, string> {
  if (typeof document === "undefined") return {};

  return document.cookie
    .split(";")
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, pair) => {
      const [rawKey, ...rawValue] = pair.trim().split("=");
      if (rawKey) {
        acc[decodeURIComponent(rawKey)] = decodeURIComponent(rawValue.join("="));
      }
      return acc;
    }, {});
}

/**
 * Check if a cookie with the given name exists.
 *
 * @example
 * if (hasCookie("sitp_token")) { ... }
 */
export function hasCookie(name: string): boolean {
  return getCookie(name) !== null;
}

// ─── Auth Token Shortcuts ─────────────────────────────────────────────────────

/**
 * Persist the JWT access token in a cookie.
 *
 * @param token     JWT string returned by the login API.
 * @param remember  If true, stores for 7 days; otherwise creates a session cookie.
 *
 * @example
 * setAuthToken(res.access_token, keepLoggedIn);
 */
export function setAuthToken(token: string, remember = true): void {
  setCookie(AUTH_COOKIE_KEY, token, {
    expiryDays: remember ? DEFAULT_EXPIRY_DAYS : undefined,
    path: "/",
    sameSite: "Lax",
    // secure: true, // uncomment in production (HTTPS)
  });
}

/**
 * Read the JWT access token from cookies. Returns `null` if not present.
 *
 * @example
 * const token = getAuthToken();
 */
export function getAuthToken(): string | null {
  return getCookie(AUTH_COOKIE_KEY);
}

/**
 * Remove the JWT cookie — effectively logging the user out client-side.
 *
 * @example
 * removeAuthToken();
 * router.push("/login");
 */
export function removeAuthToken(): void {
  removeCookie(AUTH_COOKIE_KEY);
}
