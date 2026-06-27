"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, CheckCircle2, ArrowRight, ShieldCheck } from "lucide-react";
import Reveal from "./Reveal";

export default function CTAForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple client side validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus("error");
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setStatus("loading");

    // Simulate API request delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    setStatus("success");
    setEmail("");
  };

  return (
    <section id="cta" className="py-24 relative overflow-hidden">
      
      {/* Glow Effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full glow-spot-secondary opacity-25 pointer-events-none filter blur-2xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full glow-spot-primary opacity-20 pointer-events-none filter blur-xl" />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* High impact border card */}
        <Reveal direction="up" className="glass-card rounded-3xl border border-brand-border bg-brand-card/45 p-8 md:p-12 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />
          
          <div className="max-w-2xl mx-auto relative z-10">
            <h2 className="text-3xl md:text-5xl font-extrabold text-text-primary font-display leading-tight">
              Ready to Orchestrate Your Enterprise?
            </h2>
            <p className="text-text-secondary mt-4 text-sm md:text-base leading-relaxed">
              Join the OrchestrAI early-access program. Assemble specialized agent teams, recall institutional memory, and automate complex workflows — with humans in control and full traceability.
            </p>

            <div className="mt-10">
              <AnimatePresence mode="wait">
                {status === "success" ? (
                  <motion.div
                    key="success-state"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-6 bg-green-500/10 border border-green-500/20 rounded-2xl flex flex-col items-center max-w-md mx-auto"
                  >
                    <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 mb-3 shadow-md">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-text-primary">You&apos;re on the list!</h3>
                    <p className="text-text-secondary text-xs mt-2 text-center">
                      Thanks for your interest in OrchestrAI. We&apos;ll reach out with early-access details and a guided walkthrough soon.
                    </p>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form-state"
                    onSubmit={handleSubmit}
                    className="max-w-md mx-auto"
                  >
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1 relative">
                        <label htmlFor="cta-email" className="sr-only">
                          Email address
                        </label>
                        <input
                          type="email"
                          id="cta-email"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (status === "error") setStatus("idle");
                          }}
                          placeholder="enter your work email..."
                          className="w-full px-5 py-3 rounded-full bg-brand-card-light border border-brand-border text-text-primary placeholder-text-faint text-sm focus:outline-none focus:border-brand-cyan/85 transition-colors shadow-inner"
                          required
                          disabled={status === "loading"}
                        />
                      </div>
                      
                      <button
                        type="submit"
                        id="cta-submit-btn"
                        disabled={status === "loading"}
                        className="btn-brutal justify-center shrink-0 disabled:opacity-70"
                      >
                        {status === "loading" ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <span>Request Access</span>
                            <Send className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>

                    {status === "error" && (
                      <motion.p
                        role="alert"
                        aria-live="polite"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-500 dark:text-red-400 text-xs mt-3 text-left pl-4 font-mono"
                      >
                        {errorMessage}
                      </motion.p>
                    )}
                  </motion.form>
                )}
              </AnimatePresence>
            </div>

            {/* Compliance/Security tags */}
            <div className="mt-8 pt-8 border-t border-brand-border flex flex-wrap items-center justify-center gap-6 text-text-muted text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-brand-cyan" />
                <span>Policy-as-Code Governance</span>
              </div>
              <div>
                <span>• SOC2-Ready</span>
              </div>
              <div>
                <span>• Full Audit Trail</span>
              </div>
            </div>

          </div>
        </Reveal>

      </div>
    </section>
  );
}
