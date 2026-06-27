/**
 * Keycloak Direct Access Grant (Resource Owner Password) client.
 *
 * The `orchestrai-dashboard` realm client is a public client with
 * `directAccessGrantsEnabled: true`, so we authenticate username/password
 * straight against the token endpoint and keep the custom split-screen UI
 * (no redirect to Keycloak's hosted login page).
 *
 * Tokens are RS256 JWTs. We never verify the signature on the client — the
 * gateway does that on every request (see gateway/app/core/auth.py). Here we
 * only decode the payload to read roles / department / expiry for UI gating.
 */

const KC_URL = process.env.NEXT_PUBLIC_KEYCLOAK_URL ?? "http://localhost:8080";
const REALM = process.env.NEXT_PUBLIC_KEYCLOAK_REALM ?? "orchestrai";
const CLIENT_ID =
  process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID ?? "orchestrai-dashboard";

const TOKEN_ENDPOINT = `${KC_URL}/realms/${REALM}/protocol/openid-connect/token`;
const LOGOUT_ENDPOINT = `${KC_URL}/realms/${REALM}/protocol/openid-connect/logout`;

export interface TokenSet {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
}

/** Decoded subset of the access-token payload we care about for UI gating. */
export interface AccessClaims {
  sub: string;
  email?: string;
  preferred_username?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  department?: string;
  realm_access?: { roles?: string[] };
  exp: number;
}

export class KeycloakError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "KeycloakError";
  }
}

/** Decode a JWT payload (no verification — gateway verifies). */
export function decodeToken(token: string): AccessClaims {
  const payload = token.split(".")[1];
  const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
  return JSON.parse(
    decodeURIComponent(
      json
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    ),
  );
}

export function rolesFromToken(token: string): string[] {
  try {
    return decodeToken(token).realm_access?.roles ?? [];
  } catch {
    return [];
  }
}

/** Seconds until the token expires (negative = already expired). */
export function secondsUntilExpiry(token: string): number {
  try {
    return decodeToken(token).exp - Math.floor(Date.now() / 1000);
  } catch {
    return -1;
  }
}

/** Exchange username/password for a token set (direct access grant). */
export async function passwordLogin(
  username: string,
  password: string,
): Promise<TokenSet> {
  const body = new URLSearchParams({
    grant_type: "password",
    client_id: CLIENT_ID,
    username,
    password,
    scope: "openid",
  });

  let res: Response;
  try {
    res = await fetch(TOKEN_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "ngrok-skip-browser-warning": "true",
      },
      body,
    });
  } catch {
    throw new KeycloakError(
      "Cannot reach the identity server. Is Keycloak running on " +
        KC_URL +
        "?",
    );
  }

  if (!res.ok) {
    if (res.status === 401) {
      throw new KeycloakError("Invalid username or password.", 401);
    }
    const detail = await res.json().catch(() => null);
    throw new KeycloakError(
      detail?.error_description ?? `Login failed (${res.status}).`,
      res.status,
    );
  }
  return res.json();
}

/** Refresh an access token using the refresh token. */
export async function refreshTokens(refreshToken: string): Promise<TokenSet> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: CLIENT_ID,
    refresh_token: refreshToken,
  });
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "ngrok-skip-browser-warning": "true",
    },
    body,
  });
  if (!res.ok) throw new KeycloakError("Session expired.", res.status);
  return res.json();
}

/** Best-effort Keycloak-side session logout (revokes the refresh token). */
export async function endSession(refreshToken: string): Promise<void> {
  try {
    await fetch(LOGOUT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        refresh_token: refreshToken,
      }),
    });
  } catch {
    /* logout is best-effort; clearing local state is what matters */
  }
}
