"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSidebar } from "./SidebarContext";
import ProjectSwitcher from "./ProjectSwitcher";
import { useProjectStore } from "@/store/useProjectStore";

const navItems = [
  { href: "/dashboard",   label: "Overview",        icon: "⊞" },
  { href: "/agents",      label: "Agent Network",   icon: "◈", badge: 5 },
  { href: "/research",    label: "Market Research", icon: "◎" },
  { href: "/competitors", label: "Competitors",     icon: "⬡" },
  { href: "/risks",       label: "Risk Analysis",   icon: "⚠" },
  { href: "/financials",  label: "Financials",      icon: "◆" },
  { href: "/pitch",       label: "Pitch Deck",      icon: "✦" },
  { href: "/roadmap",     label: "Roadmap",         icon: "⟳" },
  { href: "/validation",  label: "Validation",      icon: "◉" },
];

const settingsItem = { href: "/settings", label: "Settings", icon: "⚙" };

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { expanded, setExpanded } = useSidebar();
  const { projects, activeId } = useProjectStore();
  const activeProject = projects.find((p) => p.id === activeId);
  const locked = !activeProject?.intakeComplete;

  return (
    <motion.aside
      animate={{ width: expanded ? 224 : 56 }}
      transition={{ type: "spring", damping: 28, stiffness: 260 }}
      className="fixed left-0 top-0 h-screen flex flex-col z-40 overflow-hidden"
      style={{ background: "var(--sidebar-bg)", borderRight: "1px solid var(--card-border)" }}
    >
      {/* ── Logo row ── */}
      <div className="flex items-center border-b flex-shrink-0"
        style={{ borderColor: "var(--card-border)", height: 64 }}>

        {/* S icon — click = home */}
        <button onClick={() => router.push("/")}
          className="flex items-center justify-center flex-shrink-0 hover:opacity-80 transition-opacity"
          style={{ width: 56, height: 64 }} title="Home">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm"
            style={{ background: "var(--accent)", color: "#0a0a0a" }}>S</div>
        </button>

        {/* Name + collapse arrow */}
        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.15 }}
              className="flex items-center justify-between flex-1 pr-3 min-w-0">
              <button onClick={() => router.push("/")}
                className="flex flex-col text-left hover:opacity-80 transition-opacity min-w-0">
                <span className="font-bold text-sm leading-tight text-white">StartupOS</span>
                <span className="text-xs leading-tight" style={{ color: "var(--muted-fg)" }}>Builder Platform</span>
              </button>
              <button onClick={() => setExpanded(false)}
                className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center hover:bg-white/10 transition-colors"
                style={{ color: "var(--muted-fg)" }} title="Collapse">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Invisible expand hit area when collapsed */}
        {!expanded && (
          <button onClick={() => setExpanded(true)}
            className="absolute left-0 top-0 w-14 h-16"
            style={{ background: "transparent" }} />
        )}
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden">

        {/* Locked intake notice (expanded only) */}
        {locked && expanded && (
          <div className="mx-2 mb-3 px-3 py-2.5 rounded-xl"
            style={{ background: "rgba(218,242,100,0.04)", border: "1px dashed rgba(218,242,100,0.15)" }}>
            <p className="text-xs font-semibold" style={{ color: "var(--accent)" }}>⚡ Briefing required</p>
            <p className="text-xs mt-0.5 leading-snug" style={{ color: "#444" }}>
              Describe your idea first to unlock analysis features.
            </p>
          </div>
        )}

        {/* Main nav items — locked or active */}
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          if (locked) {
            // Locked state — greyed out, not clickable
            return (
              <div key={item.href}
                title={!expanded ? `${item.label} — complete briefing first` : undefined}
                className={cn(
                  "flex items-center gap-3 mx-2 my-0.5 rounded-lg select-none",
                  expanded ? "px-3 py-2" : "justify-center px-0 py-2"
                )}
                style={{ cursor: "not-allowed", opacity: 0.25 }}>
                <span className={cn("text-base flex-shrink-0", expanded ? "w-4 text-center" : "w-5 text-center")}
                  style={{ color: "#444" }}>
                  {item.icon}
                </span>
                {expanded && (
                  <span className="text-sm font-medium whitespace-nowrap flex-1" style={{ color: "#444" }}>
                    {item.label}
                  </span>
                )}
                {expanded && item.badge && (
                  <span className="text-xs w-4 h-4 flex items-center justify-center rounded-full"
                    style={{ background: "#1a1a1a", color: "#333", fontSize: 9 }}>
                    {item.badge}
                  </span>
                )}
              </div>
            );
          }

          // Unlocked — fully interactive
          return (
            <Link key={item.href} href={item.href}>
              <motion.div whileHover={{ x: expanded ? 2 : 0 }}
                title={!expanded ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 mx-2 my-0.5 rounded-lg cursor-pointer transition-colors relative",
                  expanded ? "px-3 py-2" : "justify-center px-0 py-2"
                )}
                style={isActive
                  ? { background: "var(--accent)", color: "#0a0a0a" }
                  : { color: "#666" }}>
                <span className={cn("text-base flex-shrink-0", expanded ? "w-4 text-center" : "w-5 text-center")}>
                  {item.icon}
                </span>
                <AnimatePresence>
                  {expanded && (
                    <motion.span initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -6 }} transition={{ duration: 0.12 }}
                      className="text-sm font-medium whitespace-nowrap flex-1">
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {item.badge && expanded && (
                  <span className="text-xs w-4 h-4 flex items-center justify-center rounded-full font-bold flex-shrink-0"
                    style={{
                      background: isActive ? "rgba(0,0,0,0.2)" : "rgba(218,242,100,0.15)",
                      color: isActive ? "#0a0a0a" : "var(--accent)",
                      fontSize: 9,
                    }}>
                    {item.badge}
                  </span>
                )}
                {item.badge && !expanded && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
                    style={{ background: "var(--accent)" }} />
                )}
              </motion.div>
            </Link>
          );
        })}

        {/* Settings — always accessible */}
        <div className="mx-2 mt-1 pt-2 border-t" style={{ borderColor: "var(--card-border)" }}>
          <Link href={settingsItem.href}>
            <motion.div whileHover={{ x: expanded ? 2 : 0 }}
              title={!expanded ? settingsItem.label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg cursor-pointer transition-colors",
                expanded ? "px-3 py-2" : "justify-center px-0 py-2"
              )}
              style={pathname === settingsItem.href
                ? { background: "var(--accent)", color: "#0a0a0a" }
                : { color: "#666" }}>
              <span className={cn("text-base flex-shrink-0", expanded ? "w-4 text-center" : "w-5 text-center")}>
                {settingsItem.icon}
              </span>
              <AnimatePresence>
                {expanded && (
                  <motion.span initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }} transition={{ duration: 0.12 }}
                    className="text-sm font-medium whitespace-nowrap">
                    {settingsItem.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
          </Link>
        </div>
      </nav>

      {/* ── Footer — Project Switcher ── */}
      <div className="border-t flex-shrink-0 p-2" style={{ borderColor: "var(--card-border)" }}>
        <ProjectSwitcher collapsed={!expanded} />
      </div>
    </motion.aside>
  );
}
