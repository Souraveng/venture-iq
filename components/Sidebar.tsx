"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSidebar } from "./SidebarContext";
import { useProjectStore } from "@/store/useProjectStore";
import { useSession, signOut } from "next-auth/react";
import { useTranslation } from "@/context/TranslationContext";

interface NavItem {
  href: string;
  key: string;
  defaultLabel: string;
  icon: string;
  badge?: number;
}

const topNavItems: NavItem[] = [
  { href: "/dashboard",     key: "dashboard",   defaultLabel: "Overview",        icon: "⊞" },
];

const agentItems: NavItem[] = [
  { href: "/research",    key: "research",    defaultLabel: "Market Research", icon: "◎" },
  { href: "/competitors", key: "competitors", defaultLabel: "Competitors",     icon: "⬡" },
  { href: "/risks",       key: "risks",       defaultLabel: "Risk Analysis",   icon: "⚠" },
  { href: "/financials",  key: "financials",  defaultLabel: "Financials",      icon: "◆" },
  { href: "/pitch",       key: "pitch",       defaultLabel: "Pitch Deck",      icon: "✦" },
  { href: "/roadmap",     key: "roadmap",     defaultLabel: "Roadmap",         icon: "⟳" },
  { href: "/validation",  key: "validation",  defaultLabel: "Validation",      icon: "◉" },
];

const settingsItem = { href: "/settings", key: "settings", defaultLabel: "Settings", icon: "⚙" };

export default function Sidebar() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const { expanded, setExpanded } = useSidebar();
  const { projects, activeId, setActive, addProject, removeProject } = useProjectStore();
  const { data: session } = useSession();
  
  // Custom sidebar states
  const [dbUser, setDbUser] = useState<any>(null);
  const [showAgents, setShowAgents] = useState(true);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  const activeProject = projects.find((p) => p.id === activeId);
  const locked = !activeProject?.intakeComplete;

  // Auto-expand Agents submenu when browsing agent routes
  const agentRoutes = ["/research", "/competitors", "/risks", "/financials", "/pitch", "/roadmap", "/validation"];
  useEffect(() => {
    if (agentRoutes.some((route) => pathname.startsWith(route))) {
      setShowAgents(true);
    }
  }, [pathname]);

  // Fetch db user profile dynamically
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/user");
        if (res.ok) {
          const data = await res.json();
          setDbUser(data);
          
          // Apply database preferences on initial load
          if (data.preferences) {
            const p = data.preferences;
            if (p.sidebarExpanded !== undefined && p.sidebarExpanded !== expanded) {
              setExpanded(p.sidebarExpanded);
            }
            if (p.activeProjectId && p.activeProjectId !== activeId) {
              // Only switch if the project is loaded in store
              const exists = useProjectStore.getState().projects.some((proj) => proj.id === p.activeProjectId);
              if (exists) {
                setActive(p.activeProjectId);
              }
            }
          }
        }
      } catch (err) {
        console.error("Error fetching sidebar user:", err);
      }
    }
    fetchUser();
    window.addEventListener("focus", fetchUser);
    return () => window.removeEventListener("focus", fetchUser);
  }, [session]);

  // Sync activeId to database preferences when it changes in the store
  useEffect(() => {
    if (activeId && session?.user?.email) {
      fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: { activeProjectId: activeId } }),
      }).catch((err) => console.error("Failed to sync active project preference:", err));
    }
  }, [activeId, session]);

  function handleCreateProject() {
    if (!newProjectName.trim()) return;
    addProject(newProjectName.trim(), "");
    setNewProjectName("");
    setShowNewProject(false);
    router.push("/dashboard");
  }

  function handleSelectProject(id: string) {
    setActive(id);
    router.push("/dashboard");
  }

  async function handleDeleteProject(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this project?")) {
      try {
        const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
        if (res.ok) {
          removeProject(id);
        }
      } catch (err) {
        console.error("Failed to delete project:", err);
      }
    }
  }

  const userName = dbUser?.name || session?.user?.name || "Founder";
  const userEmail = dbUser?.email || session?.user?.email || "founder@ventureiq.io";
  const userImage = dbUser?.image || session?.user?.image || "";
  const userInitials = userName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "FI";

  return (
    <motion.aside
      animate={{ width: expanded ? 224 : 56 }}
      transition={{ type: "spring", damping: 28, stiffness: 260 }}
      className="fixed left-0 top-16 h-[calc(100vh-64px)] flex flex-col z-40 overflow-hidden"
      style={{ background: "var(--sidebar-bg)", borderRight: "1px solid var(--card-border)" }}
    >
      {/* ── Collapse/Expand trigger ── */}
      <div className="flex items-center justify-end p-2 flex-shrink-0" style={{ height: 40 }}>
        <button onClick={() => setExpanded(!expanded)}
          className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-white/10 transition-colors"
          style={{ color: "var(--muted-fg)" }} title={expanded ? "Collapse" : "Expand"}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transform: expanded ? "rotate(0deg)" : "rotate(180deg)", transition: "transform 0.2s" }}>
            <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 py-1 overflow-y-auto overflow-x-hidden">

        {/* Locked intake notice (expanded only) */}
        {locked && expanded && (
          <div className="mx-2 mb-3 px-3 py-2.5 rounded-xl animate-pulse"
            style={{ background: "rgba(218,242,100,0.04)", border: "1px dashed rgba(218,242,100,0.15)" }}>
            <p className="text-xs font-semibold animate-float" style={{ color: "var(--accent)" }}>⚡ Briefing required</p>
            <p className="text-xs mt-0.5 leading-snug" style={{ color: "var(--muted-light)" }}>
              Describe your idea first to unlock analysis features.
            </p>
          </div>
        )}

        {/* Top-level navigation items */}
        {topNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link key={item.href} href={item.href}>
              <motion.div whileHover={{ x: expanded ? 2 : 0 }}
                title={!expanded ? (t(item.key) !== item.key ? t(item.key) : item.defaultLabel) : undefined}
                className={cn(
                  "flex items-center gap-3 mx-2 my-0.5 rounded-lg cursor-pointer transition-colors relative",
                  expanded ? "px-3 py-2" : "justify-center px-0 py-2"
                )}
                style={isActive
                  ? { background: "var(--accent)", color: "#0a0a0a" }
                  : { color: "var(--foreground)", opacity: 0.7 }}>
                <span className={cn("text-base flex-shrink-0", expanded ? "w-4 text-center" : "w-5 text-center")}>
                  {item.icon}
                </span>
                <AnimatePresence>
                  {expanded && (
                    <motion.span initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -6 }} transition={{ duration: 0.12 }}
                      className="text-sm font-semibold whitespace-nowrap flex-1">
                      {t(item.key) !== item.key ? t(item.key) : item.defaultLabel}
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

        {/* Collapsible Agents Menu */}
        <div className="mx-2 my-1 border-t border-b py-1" style={{ borderColor: "var(--card-border)" }}>
          <div
            onClick={() => setShowAgents(!showAgents)}
            className={cn(
              "flex items-center justify-between rounded-lg cursor-pointer transition-colors relative",
              expanded ? "px-3 py-2" : "justify-center px-0 py-2"
            )}
            style={{ color: "var(--foreground)", opacity: 0.7 }}
            title={!expanded ? t("activeAgents") : undefined}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-base flex-shrink-0 w-4 text-center">◈</span>
              {expanded && (
                <span className="text-sm font-semibold whitespace-nowrap flex-1">
                  {t("activeAgents")}
                </span>
              )}
            </div>
            {expanded && (
              <span className="text-[10px] text-zinc-500" style={{ transform: showAgents ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s" }}>
                ▼
              </span>
            )}
          </div>

          <AnimatePresence initial={false}>
            {showAgents && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden space-y-0.5"
              >
                {agentItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  const label = t(item.key) !== item.key ? t(item.key) : item.defaultLabel;

                  if (locked) {
                    return (
                      <div key={item.href}
                        title={!expanded ? `${label} — complete briefing first` : undefined}
                        className={cn(
                          "flex items-center gap-3 mx-1 my-0.5 rounded-lg select-none",
                          expanded ? "px-5 py-1.5" : "justify-center px-0 py-1.5"
                        )}
                        style={{ cursor: "not-allowed", opacity: 0.25 }}>
                        <span className="text-sm flex-shrink-0 w-4 text-center" style={{ color: "#444" }}>
                          {item.icon}
                        </span>
                        {expanded && (
                          <span className="text-xs font-medium whitespace-nowrap flex-1" style={{ color: "#444" }}>
                            {label}
                          </span>
                        )}
                      </div>
                    );
                  }

                  return (
                    <Link key={item.href} href={item.href}>
                      <div
                        className={cn(
                          "flex items-center gap-3 mx-1 my-0.5 rounded-lg cursor-pointer transition-colors",
                          expanded ? "px-5 py-1.5" : "justify-center px-0 py-1.5"
                        )}
                        style={isActive
                          ? { background: "rgba(218,242,100,0.15)", color: "var(--accent)" }
                          : { color: "var(--foreground)", opacity: 0.6 }}
                      >
                        <span className="text-sm flex-shrink-0 w-4 text-center">
                          {item.icon}
                        </span>
                        {expanded && (
                          <span className="text-xs font-medium whitespace-nowrap flex-1">
                            {label}
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ChatGPT-style Projects List Section */}
        <div className="mx-2 mt-3 flex flex-col gap-1.5">
          {expanded && (
            <div className="flex items-center justify-between px-3 mb-1 select-none">
              <span className="text-[10px] font-bold tracking-widest text-zinc-500">PROJECTS</span>
              <button 
                onClick={() => setShowNewProject(true)}
                className="text-xs hover:brightness-110 transition-all font-bold"
                style={{ color: "var(--accent)" }}
                title="Create New Project"
              >
                ＋ New
              </button>
            </div>
          )}

          {showNewProject && expanded && (
            <div className="mx-2 px-2.5 py-2 rounded-xl mb-2 space-y-2 border border-dashed border-zinc-700 bg-white/2">
              <input
                autoFocus
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateProject()}
                placeholder="Project name…"
                className="w-full bg-[#0a0a0a] text-xs outline-none px-2 py-1.5 rounded-lg border border-zinc-800 text-white"
              />
              <div className="flex gap-1.5">
                <button onClick={handleCreateProject}
                  className="flex-1 py-1 rounded-lg text-xs font-semibold"
                  style={{ background: "var(--accent)", color: "#0a0a0a" }}>
                  Create
                </button>
                <button onClick={() => { setShowNewProject(false); setNewProjectName(""); }}
                  className="px-2.5 py-1 rounded-lg text-xs"
                  style={{ background: "#222", color: "#666" }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="space-y-0.5 max-h-[160px] overflow-y-auto pr-1">
            {projects.map((p) => {
              const isSelected = p.id === activeId;
              const initials = p.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
              return (
                <div 
                  key={p.id}
                  onClick={() => handleSelectProject(p.id)}
                  className={cn(
                    "group/proj flex items-center justify-between rounded-lg cursor-pointer transition-colors relative",
                    expanded ? "px-3 py-2" : "justify-center px-0 py-2"
                  )}
                  style={{
                    background: isSelected ? "rgba(218,242,100,0.1)" : "transparent",
                    color: isSelected ? "var(--accent)" : "var(--foreground)",
                    opacity: isSelected ? 1 : 0.7,
                  }}
                  title={!expanded ? p.name : undefined}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                      style={{ 
                        background: isSelected ? "rgba(218,242,100,0.2)" : "rgba(255,255,255,0.05)", 
                        color: isSelected ? "var(--accent)" : "var(--muted-fg)" 
                      }}>
                      {initials}
                    </div>
                    {expanded && (
                      <span className="text-xs font-semibold truncate whitespace-nowrap">
                        {p.name}
                      </span>
                    )}
                  </div>

                  {expanded && (
                    <button
                      onClick={(e) => handleDeleteProject(e, p.id)}
                      className="opacity-0 group-hover/proj:opacity-100 p-1 rounded hover:bg-white/10 transition-all text-zinc-500 hover:text-red-400"
                      title="Delete project"
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 3H9.5M4 3V2C4 1.44772 4.44772 1 5 1H7C7.55228 1 8 1.44772 8 2V3M8.5 3V9.5C8.5 10.0523 8.05228 10.5 7.5 10.5H4.5C3.94772 10.5 3.5 10.0523 3.5 9.5V3H8.5ZM4.5 5.5V8M7.5 5.5V8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Settings — always accessible */}
        <div className="mx-2 mt-2 pt-2 border-t" style={{ borderColor: "var(--card-border)" }}>
          <Link href={settingsItem.href}>
            <motion.div whileHover={{ x: expanded ? 2 : 0 }}
              title={!expanded ? (t(settingsItem.key) !== settingsItem.key ? t(settingsItem.key) : settingsItem.defaultLabel) : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg cursor-pointer transition-colors",
                expanded ? "px-3 py-2" : "justify-center px-0 py-2"
              )}
              style={pathname === settingsItem.href
                ? { background: "var(--accent)", color: "#0a0a0a" }
                : { color: "var(--foreground)", opacity: 0.7 }}>
              <span className={cn("text-base flex-shrink-0", expanded ? "w-4 text-center" : "w-5 text-center")}>
                {settingsItem.icon}
              </span>
              <AnimatePresence>
                {expanded && (
                  <motion.span initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }} transition={{ duration: 0.12 }}
                    className="text-sm font-semibold whitespace-nowrap">
                    {t(settingsItem.key) !== settingsItem.key ? t(settingsItem.key) : settingsItem.defaultLabel}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
          </Link>
        </div>
      </nav>

      {/* ── Footer — User Profile from DB ── */}
      <div className="border-t flex-shrink-0 p-2" style={{ borderColor: "var(--card-border)" }}>
        <div
          className="flex items-center gap-2.5 rounded-xl p-2 transition-colors hover:bg-white/5 group/footer"
          style={{ border: "1px solid var(--card-border)", background: "rgba(255,255,255,0.02)" }}
          title={!expanded ? `${userName} — click to sign out` : undefined}
        >
          {/* Avatar — clicking always opens settings */}
          <Link href="/settings" className="flex-shrink-0">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold overflow-hidden"
              style={{ background: "rgba(218,242,100,0.15)", color: "#daf264" }}>
              {userImage ? (
                <img src={userImage} alt={userName} className="w-full h-full object-cover" />
              ) : (
                userInitials
              )}
            </div>
          </Link>

          {expanded && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate leading-tight">{userName}</p>
                <p className="text-[10px] truncate leading-none mt-0.5" style={{ color: "var(--muted-fg)" }}>
                  {userEmail}
                </p>
              </div>

              {/* Sign Out button — visible on hover */}
              <button
                id="sidebar-signout-btn"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="opacity-0 group-hover/footer:opacity-100 flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center transition-all hover:bg-red-500/20"
                style={{ color: "#ef4444" }}
                title="Sign out"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
