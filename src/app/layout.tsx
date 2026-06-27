import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import AuroraBackground from "@/components/AuroraBackground";
import ScrollProgress from "@/components/ScrollProgress";
import CursorSpotlight from "@/components/CursorSpotlight";
import PersistentVisual from "@/components/PersistentVisual";
import { AuthProvider } from "@/lib/auth-context";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// distinct geometric/technical face for typed headline words
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: "OrchestrAI | Dynamic Adaptive Enterprise Orchestrator",
  description: "OrchestrAI intelligently assembles specialized AI agent teams on the fly, recalls institutional memory, anticipates risks with a proactive sentinel, applies policy-as-code, and orchestrates complex multi-department workflows with full traceability.",
  keywords: ["OrchestrAI", "AI Orchestration", "Multi-Agent Systems", "Enterprise AI", "Institutional Memory", "Policy-as-Code", "Human-in-the-Loop", "Workflow Automation", "Agentic AI"],
  openGraph: {
    title: "OrchestrAI | Dynamic Adaptive Enterprise Orchestrator",
    description: "AI that intelligently assembles specialized agent teams, recalls institutional memory, anticipates risks, and orchestrates complex multi-department workflows with full traceability.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full antialiased dark scroll-smooth ${inter.variable} ${spaceGrotesk.variable}`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        {/* set theme before paint to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':true;var r=document.documentElement;r.classList.toggle('dark',d);r.style.colorScheme=d?'dark':'light';}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-brand-bg text-foreground font-sans relative overflow-x-hidden">
        
        {/* Top scroll-progress indicator */}
        <ScrollProgress />

        {/* WebGL aurora background (teal -> copper flow field).
            Falls back to static CSS gradient on reduced-motion / no WebGL. */}
        <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
          <AuroraBackground />
        </div>

        {/* Interactive cursor light blended over the aurora */}
        <CursorSpotlight />

        {/* Persistent 3D engine-core — full opacity in the platform/hero
            section, fades to a dim shadow once scrolled past (never vanishes).
            Theme-aware blend. Hidden below lg. */}
        <PersistentVisual />

        {/* Subtle grain texture over the aurora */}
        <div className="fixed inset-0 pointer-events-none noise-overlay z-[1] opacity-60" />

        {/* All page content renders above the background */}
        <div className="relative z-[2]">
          <AuthProvider>{children}</AuthProvider>
        </div>
      </body>
    </html>
  );
}
