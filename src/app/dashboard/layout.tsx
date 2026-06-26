"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  BarChart3, Settings, ShieldAlert, Cpu, ListCollapse, LogOut, Terminal, Sparkles
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: SidebarItem[] = [
  {
    name: "Overview",
    href: "/dashboard",
    icon: <BarChart3 className="w-4.5 h-4.5" />
  },
  {
    name: "Workflow Graph",
    href: "/dashboard/graph",
    icon: <Cpu className="w-4.5 h-4.5" />
  },
  {
    name: "Audit Logs",
    href: "/dashboard/logs",
    icon: <ListCollapse className="w-4.5 h-4.5" />
  },
  {
    name: "LLM Config",
    href: "/dashboard/llm",
    icon: <Terminal className="w-4.5 h-4.5" />
  },
  {
    name: "Governance",
    href: "/dashboard/settings",
    icon: <Settings className="w-4.5 h-4.5" />
  }
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [adminName, setAdminName] = useState("Admin Dashboard");
  const [adminEmail, setAdminEmail] = useState("admin@gmail.com");

  useEffect(() => {
    const email = localStorage.getItem("userEmail");
    const name = localStorage.getItem("userName");
    
    // Auto redirect if not logged in as admin for demo purposes
    if (email && email !== "admin@gmail.com") {
      router.push("/request");
    }
    if (name) setAdminName(name);
    if (email) setAdminEmail(email);
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/auth");
  };

  const navSections = [
    {
      title: "Operations & Control",
      items: [
        { name: "Overview", href: "/dashboard", icon: <BarChart3 className="w-4.5 h-4.5" /> },
        { name: "Workflow Graph", href: "/dashboard/graph", icon: <Cpu className="w-4.5 h-4.5" /> }
      ],
    },
    {
      title: "Compliance & Logs",
      items: [
        { name: "Audit Logs", href: "/dashboard/logs", icon: <ListCollapse className="w-4.5 h-4.5" /> }
      ],
    },
    {
      title: "System Registry",
      items: [
        { name: "LLM Config", href: "/dashboard/llm", icon: <Terminal className="w-4.5 h-4.5" /> },
        { name: "Governance", href: "/dashboard/settings", icon: <Settings className="w-4.5 h-4.5" /> }
      ],
    }
  ];

  return (
    <div className="min-h-screen w-full flex bg-brand-bg text-foreground relative z-10">
      
      {/* Ambient background glow orbs — same language as landing page */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full glow-spot-primary opacity-30 animate-orb-1" />
        <div className="absolute top-1/3 -right-32 w-[400px] h-[400px] rounded-full glow-spot-secondary opacity-20 animate-orb-2" />
        <div className="absolute -bottom-32 left-1/3 w-[350px] h-[350px] rounded-full glow-spot-primary opacity-15 animate-orb-3" />
        <div className="noise-overlay fixed inset-0" />
      </div>

      {/* Sidebar navigation */}
      <aside className="w-64 border-r border-brand-border bg-brand-card/60 backdrop-blur-xl hidden md:flex flex-col justify-between p-6 h-screen sticky top-0">
        <div className="flex flex-col gap-6">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl icon-grad-mix flex items-center justify-center font-black text-white text-lg shadow-lg">
              O
            </div>
            <div className="flex flex-col">
              <span className="font-bold tracking-tight text-foreground font-display text-base">
                Orchestr<span className="text-brand-cyan">AI</span>
              </span>
              <span className="text-[9px] uppercase tracking-widest text-gray-400 font-mono">
                Management Console
              </span>
            </div>
          </div>

          {/* Navigation link group organized by sections */}
          <div className="flex flex-col gap-5">
            {navSections.map((section, secIdx) => (
              <div key={secIdx} className="space-y-1.5">
                <span className="text-[9px] font-bold font-mono tracking-widest text-gray-400 block pl-3 uppercase">
                  {section.title}
                </span>
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group relative border border-transparent ${
                          isActive 
                            ? "text-brand-teal font-bold" 
                            : "text-gray-400 hover:text-foreground"
                        }`}
                      >
                        {/* Animated sliding active pill */}
                        {isActive && (
                          <motion.span
                            layoutId="sidebar-active-pill"
                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                            className="absolute inset-0 rounded-xl bg-brand-teal/10 border border-brand-teal/20 -z-10"
                          />
                        )}

                        {/* Hover background for inactive items */}
                        {!isActive && (
                          <span className="absolute inset-0 rounded-xl bg-transparent group-hover:bg-white/5 dark:group-hover:bg-white/5 group-hover:bg-black/[0.03] transition-colors -z-10" />
                        )}

                        <span className={isActive ? "scale-105 text-brand-teal" : "opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all"}>
                          {item.icon}
                        </span>
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Footer (Profile + theme toggle + sign out) */}
        <div className="flex flex-col gap-4 border-t border-brand-border pt-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-foreground">{adminName}</span>
              <span className="text-[9px] text-gray-400 font-mono leading-none mt-1">{adminEmail}</span>
            </div>
            <ThemeToggle />
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-red-400 border border-brand-border bg-brand-card/50 hover:bg-red-500/10 hover:border-red-500/20 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Mobile Header bar */}
        <header className="md:hidden h-16 border-b border-brand-border bg-brand-card/70 backdrop-blur-xl sticky top-0 z-40 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg icon-grad-mix flex items-center justify-center font-black text-white text-xs">
              O
            </div>
            <span className="font-bold tracking-tight text-foreground font-display text-sm">
              Orchestr<span className="text-brand-teal">AI</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button 
              onClick={handleLogout}
              className="p-1.5 rounded-lg border border-brand-border text-gray-400 hover:text-red-400"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Mobile Nav Drawer for smaller screens */}
        <nav className="md:hidden bg-brand-card/60 backdrop-blur-xl border-b border-brand-border px-4 py-2 flex items-center justify-around overflow-x-auto gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  isActive ? "text-brand-teal bg-brand-teal/10" : "text-gray-400"
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Content Wrapper */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

    </div>
  );
}
