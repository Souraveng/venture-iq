"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProjectStore } from "@/store/useProjectStore";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function EditProjectPanel({ open, onClose }: Props) {
  const { projects, activeId, updateProject } = useProjectStore();
  const active = projects.find((p) => p.id === activeId)!;

  const [name, setName] = useState(active?.name ?? "");
  const [desc, setDesc] = useState(active?.description ?? "");

  // sync when active project changes
  useEffect(() => {
    if (active) { setName(active.name); setDesc(active.description); }
  }, [active?.id]);

  function save() {
    if (!name.trim()) return;
    updateProject(activeId, { name: name.trim(), description: desc.trim() });
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)" }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full z-50 flex flex-col"
            style={{ width: 420, background: "#111", borderLeft: "1px solid #222" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: "#1e1e1e" }}>
              <div>
                <h2 className="font-bold text-base text-white">Edit Project</h2>
                <p className="text-xs mt-0.5" style={{ color: "#555" }}>Update your startup idea and context</p>
              </div>
              <button onClick={onClose}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-lg transition-colors hover:bg-white/10"
                style={{ color: "#555" }}>
                ×
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

              {/* Name */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: "#555" }}>
                  Project Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-sm px-3 py-2.5 rounded-xl outline-none text-white"
                  style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
                  placeholder="e.g. EV Startup Platform"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: "#555" }}>
                  Startup Idea
                </label>
                <textarea
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  rows={4}
                  className="w-full text-sm px-3 py-2.5 rounded-xl outline-none resize-none text-white"
                  style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
                  placeholder="Describe your startup idea, target market, and key problem you're solving…"
                />
              </div>

              {/* Add context */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: "#555" }}>
                  Additional Context <span style={{ color: "#444" }}>(optional)</span>
                </label>
                <textarea
                  rows={3}
                  className="w-full text-sm px-3 py-2.5 rounded-xl outline-none resize-none text-white"
                  style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
                  placeholder="Add any extra context for the agents — target geography, budget constraints, tech preferences…"
                />
              </div>

              {/* Re-run options */}
              <div className="rounded-xl p-4 space-y-2" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}>
                <p className="text-xs font-semibold text-white mb-3">After saving, re-run:</p>
                {["All agents (full analysis)", "Only affected agents", "No re-run — just update details"].map((opt, i) => (
                  <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                    <div className="w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors"
                      style={{ borderColor: i === 0 ? "var(--accent)" : "#333", background: i === 0 ? "var(--accent)" : "transparent" }}>
                      {i === 0 && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                    </div>
                    <span className="text-xs" style={{ color: i === 0 ? "white" : "#555" }}>{opt}</span>
                  </label>
                ))}
              </div>

              {/* Danger zone */}
              <div className="rounded-xl p-4" style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.12)" }}>
                <p className="text-xs font-semibold mb-2" style={{ color: "#f87171" }}>Danger Zone</p>
                <button className="text-xs px-3 py-1.5 rounded-lg transition-colors hover:opacity-80"
                  style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}>
                  Delete project
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t flex gap-3" style={{ borderColor: "#1e1e1e" }}>
              <button onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-white/5"
                style={{ background: "#1a1a1a", color: "#666", border: "1px solid #2a2a2a" }}>
                Cancel
              </button>
              <button onClick={save}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                style={{ background: "var(--accent)", color: "#0a0a0a" }}>
                Save & Re-run →
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
