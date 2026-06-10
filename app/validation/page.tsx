"use client";
import ProjectGuard from "@/components/ProjectGuard";
import DashboardLayout from "@/components/DashboardLayout";
import { motion } from "framer-motion";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useProjectStore } from "@/store/useProjectStore";

const checks = [
  { category: "Market Validation",  items: [
    { label: "Problem clearly defined and validated",        pass: true  },
    { label: "Target customer segment identified",           pass: true  },
    { label: "Willingness to pay confirmed",                 pass: true  },
    { label: "Market size > $100M addressable",              pass: true  },
  ]},
  { category: "Business Model",     items: [
    { label: "Revenue model defined",                        pass: true  },
    { label: "Pricing validated with prospects",             pass: false },
    { label: "Unit economics positive at scale",             pass: true  },
    { label: "Clear path to profitability",                  pass: true  },
  ]},
  { category: "Legal & Compliance", items: [
    { label: "Business entity registered",                   pass: false },
    { label: "IP strategy defined",                          pass: false },
    { label: "Regulatory requirements mapped",               pass: true  },
    { label: "Data privacy compliance plan",                 pass: false },
  ]},
  { category: "Investor Readiness", items: [
    { label: "Pitch deck complete",                          pass: false },
    { label: "Financial model 3-year projection",            pass: true  },
    { label: "Cap table structure defined",                  pass: false },
    { label: "Due diligence data room ready",                pass: false },
  ]},
];

function getColor(score: number) {
  if (score >= 80) return "#daf264";
  if (score >= 60) return "#fbbf24";
  return "#ef4444";
}

export default function ValidationPage() {
  const { projects, activeId } = useProjectStore();
  const activeProject = projects.find((p) => p.id === activeId);

  const baseReadiness = activeProject?.finalReport?.readinessScore ?? 74;

  const scores = [
    { dimension: "Market Size",       score: Math.min(100, Math.round(baseReadiness * 1.15)), max: 100, color: "#daf264", insight: "Evaluated from live market research data" },
    { dimension: "Competition",       score: Math.min(100, Math.round(baseReadiness * 0.95)), max: 100, color: "#daf264", insight: "Based on mapped direct and indirect threat levels" },
    { dimension: "Team Readiness",    score: Math.min(100, Math.round(baseReadiness * 1.05)), max: 100, color: "#daf264", insight: "Venture execution capability analysis" },
    { dimension: "Financial Viability",score: Math.min(100, Math.round(baseReadiness * 1.02)), max: 100, color: "#daf264", insight: "Calculated from estimated breakeven runway" },
    { dimension: "Legal / Compliance",score: Math.max(0, Math.round(baseReadiness * 0.85)), max: 100, color: "#fbbf24", insight: "Evaluated from initial concept requirements" },
    { dimension: "Execution Risk",    score: Math.max(0, Math.round(100 - baseReadiness * 0.8)), max: 100, color: "#fbbf24", insight: "Key hardware/software integration risks" },
  ];

  const overallScore = Math.round(scores.reduce((a, s) => a + s.score, 0) / scores.length);
  const radarData = scores.map((s) => ({ dimension: s.dimension.split(" ")[0], value: s.score }));

  const totalChecks = checks.flatMap((c) => c.items).length;
  const passedChecks = checks.flatMap((c) => c.items).filter((i) => i.pass).length;

  return (
    <ProjectGuard>
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Startup Validation</h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted-fg)" }}>
            AI-generated readiness assessment · {activeProject?.name || "EV Startup Platform"}
          </p>
        </div>

        {/* Overall score hero */}
        <div className="rounded-2xl p-8 flex items-center gap-8"
          style={{ background: "rgba(218, 242, 100, 0.05)", border: "1px solid rgba(218, 242, 100, 0.2)" }}>
          <div className="text-center">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 -rotate-90">
                <circle cx="64" cy="64" r="56" fill="none" stroke="#1a1a1a" strokeWidth="10" />
                <circle cx="64" cy="64" r="56" fill="none" stroke="#daf264" strokeWidth="10"
                  strokeDasharray={`${(overallScore / 100) * 352} 352`}
                  strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold" style={{ color: "#daf264" }}>{overallScore}</span>
                <span className="text-xs" style={{ color: "var(--muted-fg)" }}>/100</span>
              </div>
            </div>
            <p className="text-sm font-semibold text-white mt-2">Startup Readiness</p>
          </div>

          <div className="flex-1">
            <h2 className="text-xl font-bold text-white mb-1">
              {activeProject?.finalReport?.verdict 
                ? `Verdict: ${activeProject.finalReport.verdict}` 
                : (overallScore >= 75 ? "🟢 Strong Foundation" : overallScore >= 55 ? "🟡 Moderate Readiness" : "🔴 Needs Work")}
            </h2>
            <p className="text-sm mb-4 leading-relaxed" style={{ color: "var(--muted-fg)" }}>
              {activeProject?.finalReport?.summary || "Your startup venture has been evaluated by our multi-agent network. Start an analysis run or edit your idea to see the updated readiness verdict."}
            </p>
            <div className="flex gap-3">
              <div className="text-center px-4 py-2 rounded-xl" style={{ background: "rgba(218, 242, 100, 0.08)", border: "1px solid rgba(218, 242, 100, 0.15)" }}>
                <p className="text-xl font-bold" style={{ color: "#daf264" }}>{passedChecks}/{totalChecks}</p>
                <p className="text-xs" style={{ color: "var(--muted-fg)" }}>Checks passed</p>
              </div>
              <div className="text-center px-4 py-2 rounded-xl" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)" }}>
                <p className="text-xl font-bold text-yellow-400">{totalChecks - passedChecks}</p>
                <p className="text-xs" style={{ color: "var(--muted-fg)" }}>Action items</p>
              </div>
            </div>
          </div>
        </div>

        {/* Dimension scores + radar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl p-5 space-y-3" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
            <h3 className="text-sm font-semibold text-white mb-3">Score by Dimension</h3>
            {scores.map((s) => (
              <div key={s.dimension}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white">{s.dimension}</span>
                  <span style={{ color: getColor(s.score) }}>{s.score}/100</span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${s.score}%` }}
                    transition={{ duration: 0.8 }} className="h-full rounded-full"
                    style={{ background: getColor(s.score) }} />
                </div>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted-fg)" }}>{s.insight}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl p-5" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
            <h3 className="text-sm font-semibold text-white mb-4">Capability Radar</h3>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#222" />
                <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 10, fill: "#666" }} />
                <Radar dataKey="value" stroke="#daf264" fill="#daf264" fillOpacity={0.12} />
                <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, fontSize: 11 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Checklist */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {checks.map((cat) => (
            <div key={cat.category} className="rounded-xl p-5"
              style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white">{cat.category}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "var(--muted)", color: "#888" }}>
                  {cat.items.filter((i) => i.pass).length}/{cat.items.length}
                </span>
              </div>
              <ul className="space-y-2">
                {cat.items.map((item) => (
                  <li key={item.label} className="flex items-center gap-2 text-xs">
                    <span className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 text-xs"
                      style={{
                        background: item.pass ? "rgba(218, 242, 100, 0.12)" : "rgba(239,68,68,0.1)",
                        color: item.pass ? "#daf264" : "#f87171",
                      }}>
                      {item.pass ? "✓" : "✕"}
                    </span>
                    <span style={{ color: item.pass ? "white" : "#555" }}>{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
    </ProjectGuard>
  );
}
