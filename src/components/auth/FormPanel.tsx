"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, User, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { KeycloakError } from "@/lib/keycloak";

export default function FormPanel() {
  const router = useRouter();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim()) {
      setError("Enter your username or email.");
      return;
    }
    if (!password) {
      setError("Enter your password.");
      return;
    }

    setLoading(true);
    try {
      const principal = await login(username.trim(), password);
      router.push(principal.roles.includes("requester") ? "/request" : "/dashboard");
    } catch (err) {
      setError(
        err instanceof KeycloakError
          ? err.message
          : "Something went wrong signing in.",
      );
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full w-full items-center justify-center p-8 sm:p-10 lg:p-14">
      <div className="w-full max-w-sm">
        {/* heading */}
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-text-primary">
            Sign in
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Welcome back. Access your console.
          </p>
        </div>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <Field
            icon={<User className="h-4 w-4" />}
            type="text"
            placeholder="Username or email"
            value={username}
            onChange={setUsername}
            autoComplete="username"
          />

          <Field
            icon={<Lock className="h-4 w-4" />}
            type={showPw ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            trailing={
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="text-text-muted hover:text-brand-teal transition-colors"
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />

          {error && (
            <motion.p
              role="alert"
              aria-live="polite"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs font-mono text-red-500 dark:text-red-400"
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-brutal w-full justify-center mt-2"
          >
            {loading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <>
                <span>Sign in</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ── reusable input field ── */
function Field({
  icon,
  type,
  placeholder,
  value,
  onChange,
  autoComplete,
  trailing,
}: {
  icon: React.ReactNode;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <label className="group flex items-center gap-3 rounded-xl border border-brand-border bg-brand-card-light px-4 py-3 transition-colors focus-within:border-brand-teal/60">
      <span className="text-text-muted group-focus-within:text-brand-teal transition-colors">
        {icon}
      </span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required
        className="w-full bg-transparent text-sm text-text-primary placeholder-text-faint outline-none"
      />
      {trailing}
    </label>
  );
}
