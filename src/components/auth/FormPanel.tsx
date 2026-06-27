"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, User, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { KeycloakError } from "@/lib/keycloak";

type Mode = "signin" | "signup";

interface FormPanelProps {
  mode: Mode;
  onToggle: () => void;
}

export default function FormPanel({ mode, onToggle }: FormPanelProps) {
  const isSignup = mode === "signup";
  const router = useRouter();
  const { login } = useAuth();

  // signin uses the Keycloak username (e.g. admin1, hr1) or email
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
      // requesters use the employee portal; every admin role lands on the console
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
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="font-display text-3xl font-semibold tracking-tight text-white">
              {isSignup ? "Workspace access" : "Sign in"}
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              {isSignup
                ? "OrchestrAI accounts are provisioned by your company administrator."
                : "Welcome back. Access your console."}
            </p>
          </motion.div>
        </AnimatePresence>

        {isSignup ? (
          /* Accounts aren't self-served: company_admin creates them in the
             console (Accounts page), so we point new users there instead of
             a fake registration form. */
          <div className="mt-8 space-y-5">
            <div className="rounded-xl border border-brand-border bg-[var(--surface-soft)] p-5 text-sm text-gray-300 leading-relaxed">
              <p className="font-semibold text-white mb-1.5">Need an account?</p>
              <p className="text-gray-400">
                Your company administrator creates accounts and assigns roles
                (HR, IT, Finance, CISO, CFO, DPO, or requester) from the admin
                console. Ask them to add you, then sign in with the credentials
                they share.
              </p>
            </div>
            <button
              onClick={onToggle}
              className="btn-brutal w-full justify-center"
            >
              <span>Back to sign in</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
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
                  className="text-gray-500 hover:text-brand-teal transition-colors"
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
                className="text-xs font-mono text-red-400"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-brutal w-full justify-center"
            >
              {loading ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-bg border-t-transparent" />
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* mode toggle */}
        <p className="mt-7 text-center text-sm text-gray-400">
          {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            onClick={onToggle}
            className="font-semibold text-brand-teal hover:text-brand-copper transition-colors"
          >
            {isSignup ? "Sign in" : "How to get access"}
          </button>
        </p>
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
    <label className="group flex items-center gap-3 rounded-xl border border-brand-border bg-[var(--surface-soft)] px-4 py-3 transition-colors focus-within:border-brand-teal/60">
      <span className="text-gray-500 group-focus-within:text-brand-teal transition-colors">
        {icon}
      </span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required
        className="w-full bg-transparent text-sm text-white placeholder-gray-500 outline-none"
      />
      {trailing}
    </label>
  );
}
