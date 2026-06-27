/**
 * Authenticated fetch wrapper for the FastAPI gateway.
 *
 * Attaches `Authorization: Bearer <token>` to every request. The token is read
 * from a getter injected by the AuthProvider (see `setTokenGetter`) so this
 * module stays free of React imports and usable from anywhere.
 */

const GATEWAY_URL =
  process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://localhost:8000";

let tokenGetter: () => string | null = () => null;

/** Wire the auth context's current token into the fetch layer. */
export function setTokenGetter(fn: () => string | null) {
  tokenGetter = fn;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface ApiOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Skip the Authorization header (rarely needed). */
  anonymous?: boolean;
}

export async function api<T = unknown>(
  path: string,
  { body, anonymous, headers, ...init }: ApiOptions = {},
): Promise<T> {
  const url = path.startsWith("http") ? path : `${GATEWAY_URL}${path}`;
  const token = anonymous ? null : tokenGetter();

  const res = await fetch(url, {
    ...init,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => null);
    throw new ApiError(
      errBody?.detail ?? `Request failed (${res.status})`,
      res.status,
      errBody,
    );
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

/** WebSocket URL with the access token as a query param (gateway ws auth). */
export function gatewayWs(path: string, token: string | null): string {
  const base = GATEWAY_URL.replace(/^http/, "ws");
  const sep = path.includes("?") ? "&" : "?";
  return `${base}${path}${token ? `${sep}token=${encodeURIComponent(token)}` : ""}`;
}
