"use client";
import ProjectGuard from "@/components/ProjectGuard";
import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";

const agents = [
  {
    name: "Market Research Agent", icon: "◎", color: "#daf264", status: "done",
    model: "claude-sonnet-4.5",
    desc: "Performs deep industry research, TAM/SAM/SOM analysis, customer segmentation, and geographic opportunity mapping.",
    responsibilities: ["Industry research", "Market sizing", "TAM / SAM / SOM", "Customer segments", "Industry trends"],
    outputs: ["Market Analysis Report", "Opportunity Assessment", "Growth Potential"],
    runs: 1, lastRun: "4m 12s",
  },
  {
    name: "Competitor Analysis Agent", icon: "⬡", color: "#daf264", status: "done",
    model: "claude-sonnet-4.5",
    desc: "Discovers and maps direct and indirect competitors, builds pricing and feature matrices, identifies competitive advantages.",
    responsibilities: ["Competitor discovery", "Direct vs indirect", "Product comparison", "Pricing analysis", "Competitive advantages"],
    outputs: ["Competitor Matrix", "SWOT Analysis", "Competitive Positioning"],
    runs: 1, lastRun: "3m 02s",
  },
  {
    name: "Finance Agent", icon: "◆", color: "#daf264", status: "running",
    model: "gpt-4o",
    desc: "Builds revenue projections, financial forecasting, burn rate analysis, unit economics, and investment planning.",
    responsibilities: ["Revenue projections", "Financial forecasting", "Burn rate estimation", "Profitability analysis", "Pricing strategy"],
    outputs: ["Financial Model", "Revenue Forecasts", "Unit Economics", "Funding Requirements"],
    runs: 0, lastRun: "—",
  },
  {
    name: "Legal Agent", icon: "≡", color: "#888", status: "waiting",
    model: "claude-opus-4.5",
    desc: "Recommends business structures, maps compliance requirements, regulatory research, licensing, and risk assessment.",
    responsibilities: ["Business structure", "Compliance requirements", "Regulatory research", "Licensing requirements", "Risk assessment"],
    outputs: ["Legal Readiness Report", "Compliance Checklist", "Risk Assessment"],
    runs: 0, lastRun: "—",
  },
  {
    name: "Pitch Deck Agent", icon: "✦", color: "#888", status: "waiting",
    model: "claude-sonnet-4.5",
    desc: "Crafts investor-ready pitch decks, executive summaries, and founder presentations using all prior agent outputs.",
    responsibilities: ["Investor storytelling", "Problem statement", "Solution narrative", "Market opportunity", "Business model"],
    outputs: ["Investor Pitch Deck", "Executive Summary", "Founder Presentation"],
    runs: 0, lastRun: "—",
  },
];

const statusConfig = {
  done:    { color: "#daf264", bg: "rgba(218, 242, 100, 0.1)",  label: "Completed" },
  running: { color: "#daf264", bg: "rgba(218, 242, 100, 0.15)", label: "Running"   },
  waiting: { color: "#555",    bg: "rgba(255,255,255,0.03)",label: "Waiting"   },
};

export default function AgentsPage() {
  const [selected, setSelected] = useState(agents[0]);

  return (
    <ProjectGuard>
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Agent Network</h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted-fg)" }}>
            5 specialist AI agents collaborating to build your startup package.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Agent list */}
          <div className="space-y-2">
            {agents.map((a, i) => {
              const s = statusConfig[a.status as keyof typeof statusConfig];
              return (
                <motion.div key={a.name} whileHover={{ x: 2 }}
                  onClick={() => setSelected(a)}
                  className="rounded-xl p-4 cursor-pointer flex items-center gap-3 transition-all"
                  style={{
                    background: selected.name === a.name ? "rgba(218, 242, 100, 0.07)" : "var(--card-bg)",
                    border: selected.name === a.name ? "1px solid rgba(218, 242, 100, 0.3)" : "1px solid var(--card-border)",
                  }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                    style={{ background: s.bg, color: s.color }}>
                    {a.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{a.name}</p>
                    <p className="text-xs" style={{ color: "var(--muted-fg)" }}>Step {i + 1}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                    style={{ background: s.bg, color: s.color }}>{s.label}</span>
                </motion.div>
              );
            })}
          </div>

          {/* Agent detail */}
          <AnimatePresence mode="wait">
            <motion.div key={selected.name}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="lg:col-span-2 rounded-xl p-6 space-y-5"
              style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                    style={{ background: "rgba(218, 242, 100, 0.1)", color: "var(--accent)" }}>
                    {selected.icon}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">{selected.name}</h2>
                    <p className="text-xs" style={{ color: "var(--muted-fg)" }}>Model: {selected.model}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="text-xs px-3 py-1.5 rounded-lg font-medium"
                    style={{ background: "rgba(218, 242, 100, 0.1)", color: "var(--accent)", border: "1px solid rgba(218, 242, 100, 0.2)" }}>
                    Configure
                  </button>
                  <button className="text-xs px-3 py-1.5 rounded-lg font-medium text-white"
                    style={{ background: "var(--accent)", color: "#0a0a0a" }}>
                    ⟳ Re-run
                  </button>
                </div>
              </div>

              <p className="text-sm leading-relaxed" style={{ color: "var(--muted-fg)" }}>{selected.desc}</p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "var(--muted-fg)" }}>Responsibilities</h3>
                  <ul className="space-y-1.5">
                    {selected.responsibilities.map((r) => (
                      <li key={r} className="flex items-center gap-2 text-xs text-white">
                        <span style={{ color: "var(--accent)" }}>→</span> {r}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "var(--muted-fg)" }}>Outputs</h3>
                  <ul className="space-y-1.5">
                    {selected.outputs.map((o) => (
                      <li key={o} className="flex items-center gap-2 text-xs text-white">
                        <span className="w-4 h-4 rounded flex items-center justify-center text-xs"
                          style={{ background: "rgba(218, 242, 100, 0.12)", color: "var(--accent)" }}>✓</span>
                        {o}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2 border-t" style={{ borderColor: "var(--card-border)" }}>
                {[
                  { label: "Runs", value: selected.runs || "—" },
                  { label: "Last run", value: selected.lastRun },
                  { label: "Status", value: statusConfig[selected.status as keyof typeof statusConfig].label },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center rounded-lg py-2"
                    style={{ background: "var(--background)", border: "1px solid var(--card-border)" }}>
                    <p className="text-sm font-bold text-white">{value}</p>
                    <p className="text-xs" style={{ color: "var(--muted-fg)" }}>{label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
    </ProjectGuard>
  );
}
