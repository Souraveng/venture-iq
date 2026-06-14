"use client";
import ProjectGuard from "@/components/ProjectGuard";
import DashboardLayout from "@/components/DashboardLayout";
import { motion } from "framer-motion";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useProjectStore } from "@/store/useProjectStore";
import { useTranslatedReport } from "@/hooks/useTranslatedReport";

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

  const fallbackAnalystReport = {
    investmentRecommendation: {
      decision: "YES",
      confidence: 78,
      reasoning: [
        "Extremely healthy unit economics with a projected LTV:CAC of 20x.",
        "Optimal entry timing aligning with massive fleet electrification cycles.",
        "Clear software-first value proposition avoiding capital-heavy hardware acquisitions."
      ],
      requiredMilestones: [
        "Validate initial charging telemetry software with at least 5 charge points under a live pilot.",
        "Deploy fallback status caching to handle grid latency or dropouts."
      ]
    },
    redFlags: [
      "Strict ₹2 Lakhs initial budget constraint severely limits runway and early hardware testing capacity.",
      "Ather Grid and Tata Power command massive pre-existing real estate advantages at prime charging spots.",
      "High reliance on third-party electricity grid distribution reliability and local DISCOM policies."
    ],
    moatAnalysis: {
      identifiedMoats: ["Proprietary grid load balancing algorithm", "Fleet transaction data network"],
      moatStrengthScore: 72,
      sustainabilityScore: 78
    }
  };

  const rawFinalReport = activeProject?.finalReport;
  const translatedFinalReport = useTranslatedReport(activeId, rawFinalReport || null);

  const rawConflicts = activeProject?.conflicts;
  const translatedConflicts = useTranslatedReport(activeId, rawConflicts || null);

  const rawReliability = activeProject?.reliability;
  const translatedReliability = useTranslatedReport(activeId, rawReliability || null);

  const analystData = (translatedFinalReport?.investmentRecommendation
    ? translatedFinalReport
    : fallbackAnalystReport) as any;

  const marketSize = translatedFinalReport?.marketAttractiveness?.overallScore ?? Math.min(100, Math.round(baseReadiness * 1.15));
  const competition = translatedFinalReport?.moatAnalysis?.moatStrengthScore ?? Math.min(100, Math.round(baseReadiness * 0.95));
  const teamReadiness = translatedFinalReport?.ventureReadiness?.executionReadinessScore ?? Math.min(100, Math.round(baseReadiness * 1.05));
  const financialViability = translatedFinalReport?.ventureReadiness?.financialReadinessScore ?? Math.min(100, Math.round(baseReadiness * 1.02));
  const legalCompliance = translatedFinalReport?.ventureReadiness?.fundraisingReadinessScore ?? Math.max(0, Math.round(baseReadiness * 0.85));
  const executionRisk = translatedFinalReport?.ventureReadiness?.customerValidationScore ?? Math.max(0, Math.round(100 - baseReadiness * 0.8));

  const scores = [
    { dimension: "Market Size",       score: marketSize, max: 100, color: "#daf264", insight: "Evaluated from live market size and growth analysis" },
    { dimension: "Competition Moat",  score: competition, max: 100, color: "#daf264", insight: "Based on defensibility barriers and replication difficulty" },
    { dimension: "Team Readiness",    score: teamReadiness, max: 100, color: "#daf264", insight: "Venture founder-market fit and execution analysis" },
    { dimension: "Financial Viability",score: financialViability, max: 100, color: "#daf264", insight: "Calculated from capital efficiency and payback timelines" },
    { dimension: "Legal / Compliance",score: legalCompliance, max: 100, color: "#fbbf24", insight: "Evaluated from regulatory compliance readiness" },
    { dimension: "Execution Risk",    score: executionRisk, max: 100, color: "#fbbf24", insight: "Evaluated from customer validation pilots and GTM status" },
  ];

  const overallScore = Math.round(scores.reduce((a, s) => a + s.score, 0) / scores.length);
  const radarData = scores.map((s) => ({ dimension: s.dimension.split(" ")[0], value: s.score }));

  // Dynamic checklist from validatedFacts, with static fallback
  const dynamicChecks = (() => {
    const vf = activeProject?.validatedFacts;
    if (vf && Array.isArray(vf) && vf.length > 0) {
      const grouped: Record<string, { label: string; pass: boolean; confidence?: number }[]> = {};
      vf.forEach((fact: any) => {
        if (!fact || typeof fact !== 'object') return;
        const cat = fact.category || "General";
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push({
          label: fact.claim || fact.statement || fact.text || "Unknown fact",
          pass: fact.status === "validated" || fact.status === "confirmed" || fact.validated === true,
          confidence: fact.confidence,
        });
      });
      return Object.entries(grouped).map(([category, items]) => ({ category, items }));
    }
    return checks.map(c => ({
      category: c.category,
      items: c.items.map(item => ({ ...item, confidence: undefined as number | undefined })),
    }));
  })();

  const totalChecks = dynamicChecks.flatMap((c) => c.items).length;
  const passedChecks = dynamicChecks.flatMap((c) => c.items).filter((i) => i.pass).length;

  const decisionColors = {
    "STRONG YES": { text: "#22c55e", bg: "rgba(34, 197, 94, 0.08)", border: "rgba(34, 197, 94, 0.2)" },
    "YES": { text: "#22c55e", bg: "rgba(34, 197, 94, 0.08)", border: "rgba(34, 197, 94, 0.2)" },
    "MAYBE": { text: "#eab308", bg: "rgba(234, 179, 8, 0.08)", border: "rgba(234, 179, 8, 0.2)" },
    "NO": { text: "#ef4444", bg: "rgba(239, 68, 68, 0.08)", border: "rgba(239, 68, 68, 0.2)" },
    "STRONG NO": { text: "#ef4444", bg: "rgba(239, 68, 68, 0.08)", border: "rgba(239, 68, 68, 0.2)" }
  };

  const decStyle = decisionColors[analystData.investmentRecommendation.decision as keyof typeof decisionColors] || decisionColors.MAYBE;

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
        <div className="rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8"
          style={{ background: "rgba(218, 242, 100, 0.03)", border: "1px solid var(--card-border)" }}>
          <div className="text-center flex-shrink-0">
            <div className="relative w-32 h-32 mx-auto">
              <svg className="w-32 h-32 -rotate-90">
                <circle cx="64" cy="64" r="56" fill="none" stroke="#1a1a1a" strokeWidth="10" />
                <circle cx="64" cy="64" r="56" fill="none" stroke="var(--accent)" strokeWidth="10"
                  strokeDasharray={`${(overallScore / 100) * 352} 352`}
                  strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-white">{overallScore}</span>
                <span className="text-xs" style={{ color: "var(--muted-fg)" }}>/100</span>
              </div>
            </div>
            <p className="text-xs font-semibold text-white mt-2">Venture Readiness Index</p>
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h2 className="text-xl font-bold text-white">
                Verdict: {activeProject?.finalReport?.verdict || "Proceed"}
              </h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded"
                style={{ background: decStyle.bg, color: decStyle.text, border: `1px solid ${decStyle.border}` }}>
                INVESTOR DECISION: {analystData.investmentRecommendation.decision}
              </span>
            </div>
            <p className="text-sm mb-4 leading-relaxed" style={{ color: "var(--muted-fg)" }}>
              {activeProject?.finalReport?.summary || "Your startup venture has been evaluated by our multi-agent network. Start an analysis run or edit your idea to see the updated readiness verdict."}
            </p>
            <div className="flex gap-3">
              <div className="text-center px-4 py-2 rounded-xl" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
                <p className="text-xl font-bold" style={{ color: "var(--accent)" }}>{passedChecks}/{totalChecks}</p>
                <p className="text-xs" style={{ color: "var(--muted-fg)" }}>Checks passed</p>
              </div>
              <div className="text-center px-4 py-2 rounded-xl" style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)" }}>
                <p className="text-xl font-bold text-yellow-400">{totalChecks - passedChecks}</p>
                <p className="text-xs" style={{ color: "var(--muted-fg)" }}>Action items</p>
              </div>
            </div>
          </div>
        </div>

        {/* Investment due diligence card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Red flags */}
          <div className="rounded-xl p-5 border lg:col-span-1" style={{ background: "rgba(239, 68, 68, 0.02)", borderColor: "rgba(239, 68, 68, 0.15)" }}>
            <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span>⚠</span> VC Due Diligence Red Flags
            </h3>
            <ul className="space-y-3">
              {(Array.isArray(analystData?.redFlags) ? analystData.redFlags : []).map((flag: string, i: number) => (
                <li key={i} className="text-xs text-white leading-relaxed flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">•</span>
                  <span>{flag}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Required Milestones */}
          <div className="rounded-xl p-5 border lg:col-span-2" style={{ background: "rgba(218, 242, 100, 0.02)", borderColor: "rgba(218, 242, 100, 0.15)" }}>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: "var(--accent)" }}>
              <span>✓</span> Required Milestones to Secure Capital
            </h3>
            <ul className="space-y-3">
              {(Array.isArray(analystData?.investmentRecommendation?.requiredMilestones) ? analystData.investmentRecommendation.requiredMilestones : []).map((ms: string, i: number) => (
                <li key={i} className="text-xs text-white leading-relaxed flex items-center gap-2">
                  <span className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 text-[10px]"
                    style={{ background: "rgba(218, 242, 100, 0.12)", color: "var(--accent)" }}>
                    {i + 1}
                  </span>
                  <span>{ms}</span>
                </li>
              ))}
            </ul>
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
                <Radar dataKey="value" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.12} />
                <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, fontSize: 11 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Checklist — dynamic from validatedFacts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dynamicChecks.map((cat) => (
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
                    {item.confidence != null && (
                      <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded"
                        style={{ background: "var(--muted)", color: "#888" }}>
                        {Math.round(item.confidence * 100)}%
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Data Conflicts */}
        {translatedConflicts && Array.isArray(translatedConflicts) && translatedConflicts.length > 0 && (
          <div className="rounded-xl p-5" style={{ background: "rgba(245,158,11,0.03)", border: "1px solid rgba(245,158,11,0.15)" }}>
            <h3 className="text-sm font-bold text-yellow-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span>⚡</span> Data Conflicts ({translatedConflicts.length})
            </h3>
            <ul className="space-y-2">
              {translatedConflicts.map((c: any, i: number) => (
                <li key={i} className="text-xs text-white leading-relaxed flex items-start gap-2">
                  <span className="text-yellow-400 mt-0.5 flex-shrink-0">•</span>
                  <span>{c && typeof c === 'object' ? (c.description || c.claim || JSON.stringify(c)) : String(c)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Source Reliability */}
        {translatedReliability && typeof translatedReliability === "object" && !Array.isArray(translatedReliability) && Object.keys(translatedReliability).length > 0 && (
          <div className="rounded-xl p-5" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
            <h3 className="text-sm font-semibold text-white mb-3">Source Reliability</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(translatedReliability).map(([key, val]: [string, any]) => (
                <div key={key} className="text-center p-3 rounded-lg" style={{ background: "var(--background)", border: "1px solid var(--card-border)" }}>
                  <p className="text-lg font-bold" style={{ color: typeof val === 'number' && val >= 0.8 ? "#daf264" : typeof val === 'number' && val >= 0.6 ? "#fbbf24" : "#f87171" }}>
                    {typeof val === 'number' ? `${Math.round(val * 100)}%` : String(val)}
                  </p>
                  <p className="text-[10px] mt-1" style={{ color: "var(--muted-fg)" }}>{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
    </ProjectGuard>
  );
}
