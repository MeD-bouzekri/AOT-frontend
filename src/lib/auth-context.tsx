"use client";

/**
 * Auth provider — single source of truth for the logged-in principal.
 *
 * Mirrors the backend Principal (gateway/app/core/auth.py): same role→dept map,
 * same authority set, same `scope()` semantics — so the UI gates exactly what
 * the gateway enforces. Tokens live in memory + sessionStorage; a timer
 * refreshes the access token before it expires.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  passwordLogin,
  refreshTokens,
  endSession,
  decodeToken,
  secondsUntilExpiry,
  type AccessClaims,
} from "./keycloak";
import { setTokenGetter } from "./api";

// ── role taxonomy (kept in lockstep with the realm + gateway) ──
export const DEPT_ROLES: Record<string, string> = {
  hr_admin: "hr",
  it_admin: "it",
  finance_admin: "finance",
};
export const AUTHORITY_ROLES: Record<string, string> = {
  ciso: "CISO",
  cfo: "CFO",
  dpo: "DPO",
};
export type Authority = "CISO" | "CFO" | "DPO";

const STORAGE_KEY = "orchestrai.auth";

export interface Principal {
  sub: string;
  email: string;
  name: string;
  roles: string[];
  department: string | null;
  isCompanyAdmin: boolean;
  /** Veto-clearing authorities held (company_admin holds all three). */
  authorities: Authority[];
  /** Data scope: 'ALL' for company_admin, else the department, else null. */
  scope: "ALL" | string | null;
}

function principalFromClaims(claims: AccessClaims): Principal {
  const roles = claims.realm_access?.roles ?? [];
  const isCompanyAdmin = roles.includes("company_admin");

  const department =
    claims.department ??
    Object.keys(DEPT_ROLES).reduce<string | null>(
      (acc, r) => acc ?? (roles.includes(r) ? DEPT_ROLES[r] : null),
      null,
    );

  const authSet = new Set<Authority>();
  for (const r of roles)
    if (r in AUTHORITY_ROLES) authSet.add(AUTHORITY_ROLES[r] as Authority);
  if (isCompanyAdmin) ["CISO", "CFO", "DPO"].forEach((a) => authSet.add(a as Authority));

  const name =
    claims.name ??
    [claims.given_name, claims.family_name].filter(Boolean).join(" ") ??
    claims.preferred_username ??
    (claims.email ? claims.email.split("@")[0] : "User");

  return {
    sub: claims.sub,
    email: claims.email ?? claims.preferred_username ?? "",
    name,
    roles,
    department,
    isCompanyAdmin,
    authorities: Array.from(authSet).sort() as Authority[],
    scope: isCompanyAdmin ? "ALL" : department,
  };
}

interface AuthState {
  principal: Principal | null;
  /** Raw access token for Authorization: Bearer headers. */
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<Principal>;
  logout: () => Promise<void>;
  hasRole: (...roles: string[]) => boolean;
  hasAuthority: (authority: Authority) => boolean;
}

const AuthContext = createContext<AuthState | null>(null);

/** Refresh this many seconds before the access token actually expires. */
const REFRESH_SKEW = 30;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [principal, setPrincipal] = useState<Principal | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshTokenRef = useRef<string | null>(null);
  const tokenRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // expose the live access token to the non-React fetch layer (api.ts)
  useEffect(() => {
    setTokenGetter(() => tokenRef.current);
  }, []);

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  const applyTokens = useCallback(
    (access: string, refresh: string) => {
      const claims = decodeToken(access);
      setToken(access);
      tokenRef.current = access;
      setPrincipal(principalFromClaims(claims));
      refreshTokenRef.current = refresh;
      try {
        sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ access, refresh }),
        );
      } catch {
        /* sessionStorage may be unavailable; in-memory still works */
      }

      // schedule a silent refresh just before expiry
      clearTimer();
      const wait = Math.max(secondsUntilExpiry(access) - REFRESH_SKEW, 5);
      timerRef.current = setTimeout(() => void silentRefresh(), wait * 1000);
    },
    // silentRefresh is stable (defined below, no deps)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const clearSession = useCallback(() => {
    clearTimer();
    setToken(null);
    tokenRef.current = null;
    setPrincipal(null);
    refreshTokenRef.current = null;
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const silentRefresh = useCallback(async () => {
    const rt = refreshTokenRef.current;
    if (!rt) return clearSession();
    try {
      const next = await refreshTokens(rt);
      applyTokens(next.access_token, next.refresh_token);
    } catch {
      clearSession();
      router.push("/auth");
    }
  }, [applyTokens, clearSession, router]);

  // rehydrate from sessionStorage on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (raw) {
          const { access, refresh } = JSON.parse(raw);
          if (secondsUntilExpiry(access) > REFRESH_SKEW) {
            if (!cancelled) applyTokens(access, refresh);
          } else {
            const next = await refreshTokens(refresh);
            if (!cancelled) applyTokens(next.access_token, next.refresh_token);
          }
        }
      } catch {
        clearSession();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      clearTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (username: string, password: string) => {
      const tokens = await passwordLogin(username, password);
      applyTokens(tokens.access_token, tokens.refresh_token);
      return principalFromClaims(decodeToken(tokens.access_token));
    },
    [applyTokens],
  );

  const logout = useCallback(async () => {
    const rt = refreshTokenRef.current;
    clearSession();
    if (rt) await endSession(rt);
    router.push("/auth");
  }, [clearSession, router]);

  const hasRole = useCallback(
    (...roles: string[]) =>
      !!principal &&
      (principal.isCompanyAdmin || roles.some((r) => principal.roles.includes(r))),
    [principal],
  );

  const hasAuthority = useCallback(
    (authority: Authority) => !!principal && principal.authorities.includes(authority),
    [principal],
  );

  return (
    <AuthContext.Provider
      value={{ principal, token, loading, login, logout, hasRole, hasAuthority }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
