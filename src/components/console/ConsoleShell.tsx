"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3, Cpu, ListCollapse, ShieldCheck, Users, Terminal, Settings,
  Send, LogOut, Menu, X, PanelLeftClose, PanelLeft,
} from "lucide-react";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth, type Authority } from "@/lib/auth-context";

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  roles?: string[];
  authorities?: Authority[];
  badge?: number;
}
interface NavSection {
  title: string;
  items: NavItem[];
}

const ICON = "w-[17px] h-[17px]";

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Navigation",
    items: [
      { name: "Requests", href: "/request",        icon: <Send       className={ICON} /> },
      { name: "Dashboard", href: "/dashboard",       icon: <BarChart3  className={ICON} /> },
      { name: "Studio",   href: "/dashboard/graph", icon: <Cpu        className={ICON} /> },
      {
        name: "Inbox",
        href: "/dashboard/veto",
        icon: <ShieldCheck className={ICON} />,
        badge: 3,
        authorities: ["CISO", "CFO", "DPO"],
      },
      { name: "Audit", href: "/dashboard/logs", icon: <ListCollapse className={ICON} /> },
    ],
  },
  {
    title: "System",
    items: [
      { name: "Employees",  href: "/dashboard/employees", icon: <Users     className={ICON} /> },
      { name: "Accounts",   href: "/dashboard/accounts",  icon: <Users     className={ICON} />, roles: ["company_admin"] },
      { name: "LLM Config", href: "/dashboard/llm",       icon: <Terminal  className={ICON} />, roles: ["company_admin"] },
      { name: "Settings",   href: "/dashboard/settings",  icon: <Settings  className={ICON} />, roles: ["company_admin"] },
    ],
  },
];

export default function ConsoleShell({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const { principal, loading, logout, hasRole, hasAuthority } = useAuth();
  const [mobileNav, setMobileNav] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!principal) {
      router.replace("/auth");
    } else if (
      principal.roles.includes("requester") &&
      !principal.isCompanyAdmin &&
      principal.roles.length === 1 &&
      pathname.startsWith("/dashboard")
    ) {
      router.replace("/request");
    }
  }, [loading, principal, pathname, router]);

  const canSee = (item: NavItem) => {
    if (item.roles && !hasRole(...item.roles)) return false;
    if (item.authorities && !item.authorities.some((a) => hasAuthority(a))) return false;
    return true;
  };

  const sections = NAV_SECTIONS
    .map((s) => ({ ...s, items: s.items.filter(canSee) }))
    .filter((s) => s.items.length > 0);

  if (loading || !principal) {
    return (
      <div className="min-h-dvh w-full flex items-center justify-center bg-[var(--bg)]">
        <div className="h-8 w-8 rounded-full border-2 border-[#8C52FF]/20 border-t-[#8C52FF] animate-spin" />
      </div>
    );
  }

  /* ── Nav links ── */
  const NavLinks = ({ onNavigate, mini = false }: { onNavigate?: () => void; mini?: boolean }) => (
    <nav className="flex flex-col gap-5">
      {sections.map((section) => (
        <div key={section.title} className="flex flex-col gap-0.5">
          {!mini && (
            <span className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-4)]">
              {section.title}
            </span>
          )}
          {section.items.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onNavigate}
                title={mini ? item.name : undefined}
                className={`relative flex items-center gap-3 rounded-lg py-2.5 text-[13px] font-medium transition-all duration-150 group ${
                  mini ? "justify-center px-0" : "px-3"
                } ${
                  isActive
                    ? "text-[var(--text-1)]"
                    : "text-[var(--text-3)] hover:text-[var(--text-1)] hover:bg-[var(--surface-3)]"
                }`}
              >
                {/* active pill background */}
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active"
                    transition={{ type: "spring", stiffness: 500, damping: 38 }}
                    className="absolute inset-0 rounded-lg"
                    style={{
                      background: "linear-gradient(135deg, rgba(140,82,255,0.14) 0%, rgba(192,132,252,0.07) 100%)",
                      border: "1px solid rgba(140,82,255,0.28)",
                    }}
                  />
                )}
                {/* left accent bar */}
                {isActive && (
                  <motion.span
                    layoutId="sidebar-bar"
                    transition={{ type: "spring", stiffness: 500, damping: 38 }}
                    className="absolute left-0 top-[20%] h-[60%] w-[3px] rounded-full"
                    style={{ background: "linear-gradient(180deg,#8C52FF 0%,#c084fc 100%)" }}
                  />
                )}
                {/* icon */}
                <span className={`relative z-10 transition-colors ${isActive ? "text-[#8C52FF]" : "text-[var(--text-4)] group-hover:text-[var(--text-3)]"}`}>
                  {item.icon}
                </span>
                {!mini && <span className="relative z-10 flex-1">{item.name}</span>}
                {/* badge */}
                {!mini && item.badge != null && (
                  <span
                    className="relative z-10 min-w-[18px] h-[18px] rounded-full px-1 flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ background: "linear-gradient(135deg,#8C52FF 0%,#c084fc 100%)" }}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );

  /* ── User identity ── */
  const Identity = ({ mini = false }: { mini?: boolean }) => (
    <div className={`flex items-center gap-2.5 ${mini ? "justify-center px-0" : "px-1"}`}>
      <div
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white shadow"
        style={{ background: "linear-gradient(135deg,#8C52FF 0%,#c084fc 100%)" }}
      >
        {initials(principal.name)}
      </div>
      {!mini && (
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-[12px] font-semibold text-[var(--text-1)]">{principal.name}</span>
          <span className="truncate text-[10px] text-[var(--text-4)]">
            {principal.isCompanyAdmin ? "Company Admin" : (principal.roles[0] ?? "User")}
          </span>
        </div>
      )}
    </div>
  );

  /* ── Inner sidebar content (shared by desktop + mobile) ── */
  const SidebarInner = ({ onNavigate, mini = false }: { onNavigate?: () => void; mini?: boolean }) => (
    <div className="flex h-full flex-col justify-between">
      <div className="flex flex-col gap-6 overflow-y-auto py-1">
        {/* Brand */}
        <div className={mini ? "flex justify-center pt-1" : "px-3 pt-1"}>
          {mini ? <Logo href="/" showWordmark={false} /> : <Logo subtitle="Console" />}
        </div>
        <NavLinks onNavigate={onNavigate} mini={mini} />
      </div>

      <div className="flex flex-col gap-3 pb-2">
        <div
          className="mx-1 pt-3 flex flex-col gap-2"
          style={{ borderTop: "1px solid var(--border-vis)" }}
        >
          <Identity mini={mini} />
          <button
            onClick={() => void logout()}
            title={mini ? "Sign out" : undefined}
            className={`flex items-center gap-2 rounded-lg py-2 text-[12px] font-medium text-[var(--text-3)] transition-colors hover:bg-gradient-to-r hover:from-red-500/15 hover:to-red-500/5 hover:text-red-500 ${
              mini ? "justify-center px-0" : "px-3"
            }`}
          >
            <LogOut className="h-3.5 w-3.5" />
            {!mini && "Sign out"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-dvh w-full bg-[var(--bg)] text-[var(--text-1)]">

      {/* ── Desktop sidebar ── */}
      <aside
        className={`sticky top-0 hidden h-dvh shrink-0 flex-col transition-[width] duration-200 md:flex ${
          collapsed ? "w-[68px]" : "w-[228px]"
        }`}
        style={{
          background: "var(--sidebar-bg)",
          borderRight: "1px solid var(--sidebar-border)",
        }}
      >
        <div className="flex h-full flex-col px-2 py-4">
          <SidebarInner mini={collapsed} />
        </div>
      </aside>

      {/* ── Main content column ── */}
      <div className="flex min-w-0 flex-1 flex-col">

        {/* ── Desktop topbar ── */}
        <header
          className="sticky top-0 z-40 hidden h-14 items-center justify-between bg-[var(--bg)] px-6 md:flex"
          style={{ borderBottom: "1px solid var(--border-vis)" }}
        >
          {/* Left: collapse toggle + current section label */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="grid h-8 w-8 place-items-center rounded-lg text-[var(--text-3)] transition-colors hover:bg-[var(--surface-3)] hover:text-[var(--text-1)]"
            >
              {collapsed ? <PanelLeft className="h-[18px] w-[18px]" /> : <PanelLeftClose className="h-[18px] w-[18px]" />}
            </button>
            <p className="text-[13px] font-semibold text-[var(--text-2)] capitalize">
              {pathname.split("/").filter(Boolean).slice(-1)[0]?.replace(/-/g, " ") ?? "Home"}
            </p>
          </div>

          {/* Right: theme toggle + user avatar */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {/* Avatar button */}
            <button
              className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3 transition-colors hover:bg-[var(--surface-3)]"
              style={{ border: "1px solid var(--border-vis)" }}
            >
              <div
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white"
                style={{ background: "linear-gradient(135deg,#8C52FF 0%,#c084fc 100%)" }}
              >
                {initials(principal.name)}
              </div>
              <span className="text-[12px] font-medium text-[var(--text-2)]">{principal.name}</span>
            </button>
          </div>
        </header>

        {/* Mobile topbar */}
        <header
          className="sticky top-0 z-40 flex h-14 items-center justify-between bg-[var(--sidebar-bg)] px-4 md:hidden"
          style={{ borderBottom: "1px solid var(--sidebar-border)" }}
        >
          <Logo />
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <button
              onClick={() => setMobileNav(true)}
              aria-label="Open menu"
              className="grid h-9 w-9 place-items-center rounded-lg text-[var(--text-2)] hover:bg-[var(--surface-3)]"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>

      {/* ── Mobile drawer ── */}
      <AnimatePresence>
        {mobileNav && (
          <div className="fixed inset-0 z-50 md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setMobileNav(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 40 }}
              className="absolute left-0 top-0 flex h-full w-72 flex-col px-2 py-4"
              style={{
                background: "var(--sidebar-bg)",
                borderRight: "1px solid var(--sidebar-border)",
              }}
            >
              <div className="flex items-center justify-between px-3 mb-4">
                <Logo subtitle="Console" />
                <button
                  onClick={() => setMobileNav(false)}
                  aria-label="Close menu"
                  className="grid h-8 w-8 place-items-center rounded-lg text-[var(--text-3)] hover:bg-[var(--surface-3)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <SidebarInner onNavigate={() => setMobileNav(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RoleBadge({ children, accent = false }: { children: React.ReactNode; accent?: boolean }) {
  if (accent) {
    return (
      <span
        className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#8C52FF]"
        style={{
          background: "rgba(140,82,255,0.10)",
          border: "1px solid rgba(140,82,255,0.30)",
        }}
      >
        {children}
      </span>
    );
  }
  return (
    <span className="rounded-md bg-[var(--surface-3)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-3)]"
      style={{ border: "1px solid var(--border-vis)" }}>
      {children}
    </span>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
