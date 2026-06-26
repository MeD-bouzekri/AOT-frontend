"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from "lucide-react";

type Mode = "signin" | "signup";

interface FormPanelProps {
  mode: Mode;
  onToggle: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function FormPanel({ mode, onToggle }: FormPanelProps) {
  const isSignup = mode === "signup";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // ── client-side validation ──
    if (isSignup && name.trim().length < 2) {
      setError("Enter your full name.");
      return;
    }
    if (!EMAIL_RE.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (isSignup && password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    // TODO(auth): replace with Keycloak Auth Code + PKCE redirect / BFF call.
    // Per auth-architecture decision: real login is Keycloak-hosted.
    // This stub just simulates the request for now.
    await new Promise((r) => setTimeout(r, 900));
    setLoading(false);
    // eslint-disable-next-line no-console
    console.log(`[auth stub] ${mode}`, { name, email });
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
            <h1 className="font-display text-3xl font-black text-white">
              {isSignup ? "Create your account" : "Sign in"}
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              {isSignup
                ? "Start routing payments in minutes."
                : "Welcome back. Access your dashboard."}
            </p>
          </motion.div>
        </AnimatePresence>

        <form onSubmit={submit} className="mt-8 space-y-4">
          {/* name — sign-up only */}
          <AnimatePresence initial={false}>
            {isSignup && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <Field
                  icon={<User className="h-4 w-4" />}
                  type="text"
                  placeholder="Full name"
                  value={name}
                  onChange={setName}
                  autoComplete="name"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <Field
            icon={<Mail className="h-4 w-4" />}
            type="email"
            placeholder="Work email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
          />

          <Field
            icon={<Lock className="h-4 w-4" />}
            type={showPw ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={setPassword}
            autoComplete={isSignup ? "new-password" : "current-password"}
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

          {/* confirm — sign-up only */}
          <AnimatePresence initial={false}>
            {isSignup && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <Field
                  icon={<Lock className="h-4 w-4" />}
                  type={showPw ? "text" : "password"}
                  placeholder="Confirm password"
                  value={confirm}
                  onChange={setConfirm}
                  autoComplete="new-password"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {!isSignup && (
            <div className="flex justify-end">
              <a
                href="#"
                className="text-xs font-medium text-gray-400 hover:text-brand-teal transition-colors"
              >
                Forgot password?
              </a>
            </div>
          )}

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
                <span>{isSignup ? "Create account" : "Sign in"}</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* mode toggle */}
        <p className="mt-7 text-center text-sm text-gray-400">
          {isSignup ? "Already have an account?" : "New to AeroPay?"}{" "}
          <button
            onClick={onToggle}
            className="font-semibold text-brand-teal hover:text-brand-copper transition-colors"
          >
            {isSignup ? "Sign in" : "Create one"}
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
