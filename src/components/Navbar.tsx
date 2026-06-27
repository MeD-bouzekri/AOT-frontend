"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Menu, X, ArrowRight } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { WordmarkLogo } from "./Logo";

interface NavbarProps {
  showSplash: boolean;
}

const navLinks = [
  { name: "Platform", href: "#platform", id: "nav-link-platform", section: "platform" },
  { name: "Sprint Updates", href: "#sprint", id: "nav-link-sprint", section: "sprint" },
  { name: "Features", href: "#features", id: "nav-link-features", section: "features" },
  { name: "Liquidity", href: "#liquidity", id: "nav-link-liquidity", section: "liquidity" },
];

export default function Navbar({ showSplash }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>("platform");
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* scroll-spy: highlight nav link of the section currently in view */
  useEffect(() => {
    const sections = navLinks
      .map((l) => document.getElementById(l.section))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: [0, 0.25, 0.5] }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <header
        className={`fixed left-0 right-0 z-50 transition-all duration-500 ease-out ${
          showSplash
            ? "top-0 bg-transparent py-10 pointer-events-none"
            : scrolled
            ? "top-3 py-0"
            : "top-0 bg-transparent py-6"
        }`}
      >
        <div
          className={`mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-500 ease-out ${
            scrolled && !showSplash
              ? "max-w-5xl rounded-full border border-brand-border bg-brand-bg/70 backdrop-blur-xl py-3 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.5)] nav-capsule-glow"
              : "max-w-7xl"
          }`}
        >
          <div className="flex items-center justify-between">
            
            {/* Logo Link Wrapper */}
            <a
              href="#"
              className={`flex transition-all duration-500 z-50 ${
                showSplash
                  ? "fixed inset-0 flex-col items-center justify-center pointer-events-none"
                  : "items-center space-x-2 group"
              }`}
              id="logo-link"
            >
              {/* Official wordmark logo (theme-aware) */}
              <motion.div
                layout
                transition={{ type: "spring", stiffness: 100, damping: 18 }}
                className="flex items-center"
              >
                <WordmarkLogo height={showSplash ? 48 : 30} />
              </motion.div>
            </a>

            {/* Desktop Navigation — sliding active pill (framer layoutId) */}
            <nav
              onMouseLeave={() => setHovered(null)}
              className={`hidden md:flex items-center gap-1 transition-opacity duration-500 ${
                showSplash ? "opacity-0 pointer-events-none" : "opacity-100"
              }`}
            >
              {navLinks.map((link) => {
                const isActive = active === link.section;
                const isHot = hovered === link.section || (hovered === null && isActive);
                return (
                  <a
                    key={link.name}
                    href={link.href}
                    id={link.id}
                    onMouseEnter={() => setHovered(link.section)}
                    className={`relative px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200 ${
                      isActive ? "text-white" : "text-gray-300 hover:text-white"
                    }`}
                  >
                    {/* the pill slides under whichever link is hot */}
                    {isHot && (
                      <motion.span
                        layoutId="nav-pill"
                        transition={{ type: "spring", stiffness: 400, damping: 32 }}
                        className="absolute inset-0 rounded-full bg-white/[0.06] border border-brand-border"
                      />
                    )}
                    {/* active link gets a teal underglow dot */}
                    {isActive && (
                      <motion.span
                        layoutId="nav-active-dot"
                        transition={{ type: "spring", stiffness: 400, damping: 32 }}
                        className="absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-brand-teal shadow-[0_0_8px_rgba(140,82,255,0.9)]"
                      />
                    )}
                    <span className="relative z-10">{link.name}</span>
                  </a>
                );
              })}
            </nav>

            {/* CTA Button */}
            <div
              className={`hidden md:flex items-center gap-3 transition-opacity duration-500 ${
                showSplash ? "opacity-0 pointer-events-none" : "opacity-100"
              }`}
            >
              <ThemeToggle />

              {/* Sign in — quiet text link */}
              <Link
                href="/auth"
                id="nav-signin"
                className="text-sm font-semibold text-gray-300 hover:text-brand-teal transition-colors"
              >
                Sign in
              </Link>

              {/* Sign up — brutal button */}
              <Link
                href="/auth"
                id="nav-signup"
                className="btn-brutal group !py-2 !px-4 !text-xs"
                style={{ ["--offset" as string]: "3px" }}
              >
                Sign up
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div
              className={`md:hidden flex items-center gap-2 transition-opacity duration-500 ${
                showSplash ? "opacity-0 pointer-events-none" : "opacity-100"
              }`}
            >
              <ThemeToggle />
              <button
                onClick={() => setIsOpen(!isOpen)}
                id="mobile-menu-toggle"
                aria-label="Toggle Menu"
                className="text-gray-300 hover:text-white focus:outline-none p-1.5 rounded-xl bg-[var(--surface-mid)] border border-brand-border"
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-[72px] z-40 md:hidden bg-brand-bg/95 backdrop-blur-lg border-b border-white/10 px-4 pt-4 pb-6 shadow-2xl"
          >
            <div className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  id={`${link.id}-mobile`}
                  onClick={() => setIsOpen(false)}
                  className="text-base font-semibold text-gray-200 hover:text-white transition-colors duration-150 py-2 border-b border-white/5"
                >
                  {link.name}
                </a>
              ))}

              {/* Sign in / Sign up */}
              <div className="flex items-center gap-3 pt-1">
                <Link
                  href="/auth"
                  id="nav-signin-mobile"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 btn-brutal-ghost justify-center"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth"
                  id="nav-signup-mobile"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 btn-brutal justify-center"
                >
                  Sign up
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
