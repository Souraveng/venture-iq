"use client";
import ProjectGuard from "@/components/ProjectGuard";
import DashboardLayout from "@/components/DashboardLayout";
import { motion } from "framer-motion";

const phases = [
  {
    phase: "Phase 1", title: "Validation", duration: "Months 1–3", status: "active",
    color: "#daf264",
    milestones: [
      { task: "Interview 50 fleet operators in Delhi-NCR", done: true },
      { task: "Build and deploy MVP charging dashboard", done: true },
      { task: "Onboard 5 pilot customers (free tier)", done: false },
      { task: "Validate $100/vehicle/month pricing", done: false },
    ],
    kpis: ["NPS > 40", "5 pilots", "PMF signal"],
  },
  {
    phase: "Phase 2", title: "MVP", duration: "Months 4–9", status: "upcoming",
    color: "#c8e84a",
    milestones: [
      { task: "Launch paid SaaS tier with 20 customers", done: false },
      { task: "Integrate with 3 major charging networks", done: false },
      { task: "Hire Sales + Customer Success leads", done: false },
      { task: "Achieve $15K MRR", done: false },
    ],
    kpis: ["$15K MRR", "20 customers", "3 integrations"],
  },
  {
    phase: "Phase 3", title: "Growth", duration: "Months 10–18", status: "upcoming",
    color: "#7ab010",
    milestones: [
      { task: "Scale to 100 fleet customers", done: false },
      { task: "Expand to 5 metro cities", done: false },
      { task: "Launch transaction revenue stream", done: false },
      { task: "Reach break-even MRR", done: false },
    ],
    kpis: ["$80K MRR", "100 customers", "5 cities"],
  },
  {
    phase: "Phase 4", title: "Fundraising", duration: "Months 16–20", status: "upcoming",
    color: "#4a7a00",
    milestones: [
      { task: "Prepare Series A data room", done: false },
      { task: "Hit $350K ARR milestone", done: false },
      { task: "Begin institutional investor outreach", done: false },
      { task: "Close $12M Series A", done: false },
    ],
    kpis: ["$350K ARR", "Series A", "$12M raised"],
  },
  {
    phase: "Phase 5", title: "Scale", duration: "Month 21+", status: "upcoming",
    color: "#2a5a00",
    milestones: [
      { task: "National rollout across India", done: false },
      { task: "Launch API marketplace", done: false },
      { task: "International expansion (SEA)", done: false },
      { task: "Target $5M ARR run rate", done: false },
    ],
    kpis: ["$5M ARR", "National", "SEA launch"],
  },
];

export default function RoadmapPage() {
  return (
    <ProjectGuard>
    <DashboardLayout>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Founder Roadmap</h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted-fg)" }}>
            5-phase execution plan from validation to scale
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Connecting line */}
          <div className="absolute left-6 top-8 bottom-8 w-px"
            style={{ background: "linear-gradient(to bottom, #daf264, #2a5a00)" }} />

          <div className="space-y-6">
            {phases.map((p, i) => (
              <motion.div key={p.phase}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="relative flex gap-6">

                {/* Phase dot */}
                <div className="flex-shrink-0 w-12 flex flex-col items-center z-10">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold border-2"
                    style={{
                      background: p.status === "active" ? p.color : "#111",
                      color: p.status === "active" ? "#0a0a0a" : p.color,
                      borderColor: p.color,
                      boxShadow: p.status === "active" ? `0 0 20px ${p.color}40` : "none",
                    }}>
                    {i + 1}
                  </div>
                </div>

                {/* Phase card */}
                <div className="flex-1 rounded-2xl p-5 mb-2"
                  style={{
                    background: p.status === "active" ? "rgba(218, 242, 100, 0.05)" : "var(--card-bg)",
                    border: p.status === "active" ? `1px solid ${p.color}40` : "1px solid var(--card-border)",
                  }}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: p.color }}>{p.phase}</span>
                        {p.status === "active" && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: "rgba(218, 242, 100, 0.15)", color: p.color }}>
                            ● In Progress
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-white">{p.title}</h3>
                    </div>
                    <span className="text-xs px-3 py-1 rounded-full"
                      style={{ background: "var(--muted)", color: "#888" }}>
                      {p.duration}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Milestones */}
                    <div>
                      <p className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "var(--muted-fg)" }}>Milestones</p>
                      <ul className="space-y-2">
                        {p.milestones.map((m) => (
                          <li key={m.task} className="flex items-start gap-2 text-xs">
                            <span className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5 text-xs"
                              style={{
                                background: m.done ? `${p.color}20` : "var(--muted)",
                                color: m.done ? p.color : "#444",
                              }}>
                              {m.done ? "✓" : "○"}
                            </span>
                            <span style={{ color: m.done ? "white" : "#555" }}>{m.task}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* KPIs */}
                    <div>
                      <p className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "var(--muted-fg)" }}>Success KPIs</p>
                      <div className="flex flex-wrap gap-2">
                        {p.kpis.map((kpi) => (
                          <span key={kpi} className="text-xs px-2.5 py-1 rounded-lg font-medium"
                            style={{ background: `${p.color}12`, color: p.color, border: `1px solid ${p.color}25` }}>
                            {kpi}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
    </ProjectGuard>
  );
}
