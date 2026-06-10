"use client";
import ProjectGuard from "@/components/ProjectGuard";
import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";

const agents = [
  { name: "Atlas", role: "Research Strategist", model: "claude-sonnet-4.5", desc: "Deep web research, competitor analysis, market intel.", status: "active" as const, tasks: 1240, success: 99.1, category: "Research", color: "#818cf8" },
  { name: "Vega", role: "Planning & Roadmaps", model: "claude-sonnet-4.5", desc: "Breaks down complex goals into actionable plans.", status: "active" as const, tasks: 820, success: 97.4, category: "Planning", color: "#34d399" },
  { name: "Orion", role: "Code Execution", model: "claude-opus-4.5", desc: "Writes, runs, and debugs production-grade code.", status: "active" as const, tasks: 2100, success: 98.3, category: "Engineering", color: "#fbbf24" },
  { name: "Lyra", role: "Quality Assurance", model: "gemini-3-flash", desc: "Reviews outputs, runs tests, catches edge cases.", status: "idle" as const, tasks: 640, success: 100, category: "QA", color: "#f472b6" },
  { name: "Helios", role: "Sales Outreach", model: "gpt-4o", desc: "Qualifies leads, drafts emails, schedules demos.", status: "active" as const, tasks: 384, success: 94.2, category: "Sales", color: "#a78bfa" },
  { name: "Echo", role: "Content Writer", model: "claude-sonnet-4.5", desc: "Drafts blogs, social posts, and marketing copy.", status: "active" as const, tasks: 291, success: 99.0, category: "Content", color: "#2dd4bf" },
  { name: "Nexus", role: "Customer Support", model: "gemini-3-flash", desc: "Handles tickets, drafts replies, escalates issues.", status: "idle" as const, tasks: 1750, success: 96.8, category: "Support", color: "#fb923c" },
  { name: "Cipher", role: "Security Analyst", model: "claude-opus-4.5", desc: "Monitors threats, audits code, flags vulnerabilities.", status: "offline" as const, tasks: 112, success: 100, category: "Security", color: "#ef4444" },
];

const categories = ["All agents", "Research", "Planning", "Engineering", "QA", "Sales", "Content", "Support", "Security"];

const statusColors = { active: "#10b981", idle: "#f59e0b", offline: "#4a4a6a" };

export default function WorkspacePage() {
  const [filter, setFilter] = useState("All agents");
  const [selected, setSelected] = useState<typeof agents[0] | null>(null);

  const filtered = filter === "All agents" ? agents : agents.filter(a => a.category === filter);

  return (
    <ProjectGuard>
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Agent Library</h1>
          <p className="text-sm text-gray-400 mt-1">Browse and manage your specialist agents</p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {categories.map((c) => (
            <button key={c} onClick={() => setFilter(c)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: filter === c ? "rgba(99,102,241,0.2)" : "var(--card-bg)",
                color: filter === c ? "#818cf8" : "var(--muted-fg)",
                border: filter === c ? "1px solid rgba(99,102,241,0.4)" : "1px solid var(--card-border)"
              }}>
              {c}
            </button>
          ))}
        </div>

        {/* Agent grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {filtered.map((agent) => (
              <motion.div key={agent.name}
                layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ y: -3 }}
                onClick={() => setSelected(agent)}
                className="rounded-xl p-4 cursor-pointer agent-card"
                style={{ background: "var(--card-bg)", border: `1px solid var(--card-border)` }}>

                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold"
                    style={{ background: `${agent.color}20`, color: agent.color }}>
                    {agent.name[0]}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full"
                    style={{ background: `${statusColors[agent.status]}15`, color: statusColors[agent.status] }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusColors[agent.status] }} />
                    {agent.status}
                  </div>
                </div>

                <h3 className="font-semibold text-sm">{agent.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5 mb-3">{agent.role}</p>
                <p className="text-xs text-gray-500 mb-4 leading-relaxed">{agent.desc}</p>

                {/* Model chip */}
                <div className="flex items-center justify-between">
                  <span className="text-xs px-2 py-0.5 rounded-md font-mono"
                    style={{ background: "var(--background)", color: "var(--muted-fg)", border: "1px solid var(--card-border)" }}>
                    {agent.model}
                  </span>
                  <span className="text-xs text-gray-500">{agent.tasks.toLocaleString()} tasks</span>
                </div>

                {/* Success bar */}
                <div className="mt-3 w-full h-1 rounded-full overflow-hidden" style={{ background: "var(--background)" }}>
                  <div className="h-full rounded-full" style={{
                    width: `${agent.success}%`,
                    background: agent.success >= 98 ? "#10b981" : "#f59e0b"
                  }} />
                </div>
                <p className="text-xs mt-1" style={{ color: "var(--muted-fg)" }}>{agent.success}% success</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Detail drawer */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40" onClick={() => setSelected(null)} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-96 z-50 p-6 overflow-y-auto"
              style={{ background: "var(--sidebar-bg)", borderLeft: "1px solid var(--card-border)" }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-lg">{selected.name}</h2>
                <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-white transition-colors text-xl">×</button>
              </div>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-bold mb-4"
                style={{ background: `${selected.color}20`, color: selected.color }}>
                {selected.name[0]}
              </div>
              <p className="font-semibold mb-1">{selected.role}</p>
              <p className="text-sm text-gray-400 mb-6">{selected.desc}</p>
              <div className="space-y-3">
                {[
                  { label: "Model", value: selected.model },
                  { label: "Status", value: selected.status },
                  { label: "Total tasks", value: selected.tasks.toLocaleString() },
                  { label: "Success rate", value: `${selected.success}%` },
                  { label: "Category", value: selected.category },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between py-2 border-b" style={{ borderColor: "var(--card-border)" }}>
                    <span className="text-sm text-gray-400">{label}</span>
                    <span className="text-sm font-medium">{value}</span>
                  </div>
                ))}
              </div>
              <button className="mt-6 w-full py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                Add to workflow
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </DashboardLayout>
    </ProjectGuard>
  );
}
