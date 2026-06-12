"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useProjectStore } from "@/store/useProjectStore";

export default function ProjectSwitcher({ collapsed }: { collapsed: boolean }) {
  const { projects, activeId, setActive, addProject } = useProjectStore();
  const active = projects.find((p) => p.id === activeId);
  const [open, setOpen] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  if (!active) {
    return (
      <div className="w-full flex items-center gap-2.5 rounded-xl p-2.5"
        style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", opacity: 0.5 }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold bg-white/10 animate-pulse" />
        {!collapsed && (
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-semibold text-white truncate animate-pulse">Syncing...</p>
          </div>
        )}
      </div>
    );
  }

  const initials = active.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  const statusColor: Record<string, string> = {
    active: "#daf264",
    draft: "#666",
    complete: "#34d399",
  };

  function handleCreate() {
    if (!newName.trim()) return;
    addProject(newName.trim(), "");
    setNewName("");
    setShowNew(false);
    setOpen(false);
    router.push("/dashboard");
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2.5 rounded-xl p-2.5 transition-colors hover:bg-white/5"
        style={{ background: open ? "rgba(218,242,100,0.06)" : "var(--card-bg)", border: "1px solid var(--card-border)" }}
      >
        {/* Avatar */}
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{ background: "rgba(218,242,100,0.15)", color: "#daf264" }}>
          {initials}
        </div>

        {!collapsed && (
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-semibold text-white truncate">{active.name}</p>
            <p className="text-xs truncate" style={{ color: "var(--muted-fg)" }}>
              {active.agentsDone}/{active.totalAgents} agents · {active.progress}%
            </p>
          </div>
        )}

        {!collapsed && (
          <svg className="flex-shrink-0 transition-transform" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
            width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 4L6 8L10 4" stroke="#666" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Progress bar under trigger */}
      {!collapsed && (
        <div className="mt-1.5 w-full h-0.5 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${active.progress}%`, background: "#daf264" }} />
        </div>
      )}

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute rounded-xl overflow-hidden shadow-2xl z-50"
            style={{
              bottom: "calc(100% + 8px)",
              left: 0,
              width: collapsed ? 240 : "100%",
              background: "#1a1a1a",
              border: "1px solid #2a2a2a",
              minWidth: 220,
            }}
          >
            <div className="px-3 py-2 border-b" style={{ borderColor: "#2a2a2a" }}>
              <p className="text-xs font-semibold" style={{ color: "#666" }}>Your Projects</p>
            </div>

            <div className="py-1 max-h-52 overflow-y-auto">
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setActive(p.id);
                    setOpen(false);
                    // Use router.push — no reload, store preserved
                    if (!p.intakeComplete) {
                      router.push("/dashboard");
                    }
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-white/5 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: "rgba(218,242,100,0.1)", color: "#daf264" }}>
                    {p.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: p.id === activeId ? "#daf264" : "white" }}>
                      {p.name}
                    </p>
                    <p className="text-xs truncate" style={{ color: "#555" }}>{p.createdAt}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor[p.status] }} />
                    {p.id === activeId && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5L4.5 7.5L8.5 2.5" stroke="#daf264" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="px-2 py-2 border-t" style={{ borderColor: "#2a2a2a" }}>
              {!showNew ? (
                <button
                  onClick={() => setShowNew(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors hover:bg-white/5"
                  style={{ color: "#daf264" }}
                >
                  <span className="text-base leading-none">+</span> New Project
                </button>
              ) : (
                <div className="space-y-2 p-1">
                  <input
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                    placeholder="Project name…"
                    className="w-full bg-transparent text-xs outline-none px-2 py-1.5 rounded-lg"
                    style={{ background: "#111", border: "1px solid #333", color: "white" }}
                  />
                  <div className="flex gap-1.5">
                    <button onClick={handleCreate}
                      className="flex-1 py-1.5 rounded-lg text-xs font-semibold"
                      style={{ background: "#daf264", color: "#0a0a0a" }}>
                      Create →
                    </button>
                    <button onClick={() => setShowNew(false)}
                      className="px-3 py-1.5 rounded-lg text-xs"
                      style={{ background: "#222", color: "#666" }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
