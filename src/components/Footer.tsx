"use client";

import { WordmarkLogo } from "./Logo";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const productLinks = [
    { name: "Agent Assembly", href: "#platform" },
    { name: "Live Orchestration", href: "#liquidity" },
    { name: "How It Works", href: "#sprint" },
    { name: "Core Capabilities", href: "#features" },
  ];

  const companyLinks = [
    { name: "About OrchestrAI", href: "#" },
    { name: "Security & Trust", href: "#" },
    { name: "System Status", href: "#" },
    { name: "Careers", href: "#" },
  ];

  const devLinks = [
    { name: "Developer Documentation", href: "#" },
    { name: "API Reference", href: "#" },
    { name: "SDK Repositories", href: "#" },
    { name: "Community Forum", href: "#" },
  ];

  const legalLinks = [
    { name: "Privacy Policy", href: "#" },
    { name: "Terms of Service", href: "#" },
    { name: "Data Governance", href: "#" },
    { name: "Cookie Preferences", href: "#" },
  ];

  return (
    <footer className="bg-slate-950 border-t border-white/5 pt-16 pb-8 relative overflow-hidden terminal-console !border-x-0 !border-b-0 !rounded-none">
      
      {/* Background visual detail */}
      <div className="absolute inset-0 bg-dot-pattern opacity-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          
          {/* Logo & Intro column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center">
              <WordmarkLogo height={32} />
            </div>
            <p className="text-gray-400 text-xs md:text-sm max-w-sm leading-relaxed">
              OrchestrAI is the meta-orchestrator for enterprise workflows. It assembles specialized AI agent teams on the fly, recalls institutional memory, enforces policy-as-code, and keeps humans in the loop — with full traceability.
            </p>
            {/* Social Icons */}
            <div className="flex items-center space-x-4 pt-2">
              <a href="#" className="text-gray-400 hover:text-brand-cyan transition-colors" aria-label="X (Twitter)">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-brand-cyan transition-colors" aria-label="LinkedIn">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-brand-cyan transition-colors" aria-label="GitHub">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.28-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Links Columns */}
          <div>
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-white mb-4">
              Products
            </h4>
            <ul className="space-y-2">
              {productLinks.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-gray-400 hover:text-white text-xs md:text-sm transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-white mb-4">
              Company
            </h4>
            <ul className="space-y-2">
              {companyLinks.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-gray-400 hover:text-white text-xs md:text-sm transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-white mb-4">
              Developers
            </h4>
            <ul className="space-y-2">
              {devLinks.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-gray-400 hover:text-white text-xs md:text-sm transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Legal and Copyright bottom bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-xs text-gray-500 font-mono">
            &copy; {currentYear} OrchestrAI Inc. All rights reserved.
            <br />
            Enterprise AI orchestration platform. Workflows are executed with policy-as-code, human-in-the-loop checkpoints, and full audit traceability.
          </div>
          
          {/* Legal Links */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {legalLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-gray-500 hover:text-gray-300 text-xs transition-colors font-mono"
              >
                {link.name}
              </a>
            ))}
          </div>
        </div>

      </div>
    </footer>
  );
}
