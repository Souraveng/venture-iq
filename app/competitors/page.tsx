"use client";
import ProjectGuard from "@/components/ProjectGuard";
import DashboardLayout from "@/components/DashboardLayout";
import { motion } from "framer-motion";
import { useProjectStore } from "@/store/useProjectStore";

const competitors = [
  { name: "Ather Energy",     type: "Direct",   funding: "$380M", stage: "Series E", market: "India",         pricing: "$1,200/yr", threat: 90, strengths: ["Brand", "Hardware+SW", "Network"],     weaknesses: ["Closed ecosystem", "High price"] },
  { name: "Tata Motors EV",   type: "Direct",   funding: "$2.1B", stage: "Public",   market: "India",         pricing: "$900/yr",  threat: 85, strengths: ["Scale", "Govt backing", "Distribution"], weaknesses: ["Legacy org", "Slow software"] },
  { name: "ChargePoint",      type: "Direct",   funding: "$700M", stage: "Public",   market: "Global",        pricing: "$1,500/yr", threat: 72, strengths: ["Network size", "Partnerships"],         weaknesses: ["US-centric", "No fleet SaaS"] },
  { name: "Bolt.Earth",       type: "Direct",   funding: "$30M",  stage: "Series B", market: "India",         pricing: "$600/yr",  threat: 68, strengths: ["India-first", "B2B focus"],             weaknesses: ["Limited analytics", "No AI"] },
  { name: "Greaves Electric", type: "Indirect", funding: "$180M", stage: "Series C", market: "India",         pricing: "$800/yr",  threat: 45, strengths: ["Last-mile", "L-category"],              weaknesses: ["Not fleet-focused"] },
  { name: "Zeon Charging",    type: "Indirect", funding: "$8M",   stage: "Seed",     market: "India",         pricing: "$400/yr",  threat: 30, strengths: ["Low cost", "Partnerships"],             weaknesses: ["No SaaS layer", "Early stage"] },
];

const features = [
  "Fleet Management SaaS",
  "AI-powered Analytics",
  "Real-time Monitoring",
  "Mobile App",
  "API Integrations",
  "Multi-location Support",
  "Carbon Reporting",
  "White Label",
];

const featureMatrix: Record<string, boolean[]> = {
  "Ather Energy":     [false, false, true,  true,  false, true,  false, false],
  "Tata Motors EV":   [true,  false, true,  true,  true,  true,  false, false],
  "ChargePoint":      [true,  false, true,  true,  true,  true,  true,  true ],
  "Bolt.Earth":       [true,  false, true,  true,  false, true,  false, false],
  "Your Startup":     [true,  true,  true,  true,  true,  true,  true,  true ],
};

const swotData = {
  Strengths:     ["AI-native platform from day one", "India-first, regulatory-aware", "Fleet + individual dual market"],
  Weaknesses:    ["No hardware — pure software", "First-mover cost of education", "Dependent on EV adoption pace"],
  Opportunities: ["FAME-III subsidy policy", "Fleet electrification mandates", "B2B SaaS has 0 dominant player"],
  Threats:       ["Ather / Tata could build SaaS in-house", "Chinese OEMs entering India", "Infrastructure lag risk"],
};

const swotColors = {
  Strengths:     { bg: "rgba(218, 242, 100, 0.07)", border: "rgba(218, 242, 100, 0.2)", label: "#daf264" },
  Weaknesses:    { bg: "rgba(239,68,68,0.05)",  border: "rgba(239,68,68,0.15)",  label: "#f87171" },
  Opportunities: { bg: "rgba(218, 242, 100, 0.05)", border: "rgba(218, 242, 100, 0.15)", label: "#daf264" },
  Threats:       { bg: "rgba(245,158,11,0.05)", border: "rgba(245,158,11,0.15)", label: "#fbbf24" },
};

export default function CompetitorsPage() {
  const { projects, activeId } = useProjectStore();
  const activeProject = projects.find((p) => p.id === activeId);

  const dynamicSwot = activeProject?.marketIntel?.swot ? {
    Strengths: activeProject.marketIntel.swot.strengths || [],
    Weaknesses: activeProject.marketIntel.swot.weaknesses || [],
    Opportunities: activeProject.marketIntel.swot.opportunities || [],
    Threats: activeProject.marketIntel.swot.threats || [],
  } : swotData;

  return (
    <ProjectGuard>
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg" style={{ color: "var(--accent)" }}>⬡</span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ background: "rgba(218, 242, 100, 0.1)", color: "var(--accent)" }}>Competitor Analysis Agent · Done</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Competitor Intelligence</h1>
            <p className="text-sm mt-1" style={{ color: "var(--muted-fg)" }}>6 competitors mapped · EV Startup India</p>
          </div>
          <button className="text-xs px-3 py-2 rounded-lg font-medium"
            style={{ background: "var(--accent)", color: "#0a0a0a" }}>↓ Export Report</button>
        </div>

        {/* Competitor cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {competitors.map((c) => (
            <motion.div key={c.name} whileHover={{ y: -2 }} className="rounded-xl p-4 agent-card"
              style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold text-sm text-white">{c.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted-fg)" }}>{c.market} · {c.stage}</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    background: c.type === "Direct" ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)",
                    color: c.type === "Direct" ? "#f87171" : "#fbbf24"
                  }}>
                  {c.type}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs mb-3">
                <span style={{ color: "var(--muted-fg)" }}>Funding</span>
                <span className="font-semibold text-white">{c.funding}</span>
              </div>
              <div className="flex items-center justify-between text-xs mb-3">
                <span style={{ color: "var(--muted-fg)" }}>Pricing</span>
                <span className="font-semibold text-white">{c.pricing}</span>
              </div>

              {/* Threat meter */}
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: "var(--muted-fg)" }}>Threat level</span>
                  <span style={{ color: c.threat > 70 ? "#ef4444" : c.threat > 50 ? "#fbbf24" : "var(--accent)" }}>
                    {c.threat}/100
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                  <motion.div className="h-full rounded-full"
                    initial={{ width: 0 }} animate={{ width: `${c.threat}%` }}
                    transition={{ duration: 0.8 }}
                    style={{ background: c.threat > 70 ? "#ef4444" : c.threat > 50 ? "#fbbf24" : "var(--accent)" }} />
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {c.strengths.map((s) => (
                  <span key={s} className="text-xs px-1.5 py-0.5 rounded"
                    style={{ background: "rgba(218, 242, 100, 0.08)", color: "var(--accent)" }}>
                    {s}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Feature matrix */}
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--card-border)" }}>
          <div className="px-5 py-4" style={{ background: "var(--card-bg)", borderBottom: "1px solid var(--card-border)" }}>
            <h3 className="font-semibold text-sm text-white">Feature Comparison Matrix</h3>
          </div>
          <div className="overflow-x-auto" style={{ background: "var(--background)" }}>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                  <th className="text-left px-4 py-3 text-white font-semibold">Company</th>
                  {features.map((f) => (
                    <th key={f} className="px-3 py-3 text-center font-medium" style={{ color: "var(--muted-fg)", minWidth: 100, fontSize: 10 }}>
                      {f}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(featureMatrix).map(([company, feats]) => (
                  <tr key={company} style={{ borderBottom: "1px solid var(--card-border)" }}
                    className={company === "Your Startup" ? "" : ""}>
                    <td className="px-4 py-3 font-semibold text-sm"
                      style={{ color: company === "Your Startup" ? "var(--accent)" : "white" }}>
                      {company === "Your Startup" ? "★ " : ""}{company}
                    </td>
                    {feats.map((has, i) => (
                      <td key={i} className="px-3 py-3 text-center">
                        {has
                          ? <span style={{ color: company === "Your Startup" ? "var(--accent)" : "#555" }}>✓</span>
                          : <span style={{ color: "#2a2a2a" }}>—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SWOT */}
        <div>
          <h3 className="font-semibold text-sm text-white mb-3">SWOT Analysis — Your Startup</h3>
          <div className="grid grid-cols-2 gap-3">
            {(Object.entries(dynamicSwot) as [keyof typeof swotColors, string[]][]).map(([category, items]) => {
              const cfg = swotColors[category];
              return (
                <div key={category} className="rounded-xl p-4"
                  style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                  <p className="text-xs font-bold mb-3 uppercase tracking-wider" style={{ color: cfg.label }}>{category}</p>
                  <ul className="space-y-2">
                    {items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-xs text-white">
                        <span className="mt-0.5 flex-shrink-0" style={{ color: cfg.label }}>•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
    </ProjectGuard>
  );
}
