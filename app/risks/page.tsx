"use client";
import ProjectGuard from "@/components/ProjectGuard";
import DashboardLayout from "@/components/DashboardLayout";
import { motion } from "framer-motion";
import { useProjectStore } from "@/store/useProjectStore";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from "recharts";

const defaultRiskIntel = {
  marketRisk: {
    probability: 65,
    impact: 80,
    severity: "HIGH" as const,
    riskScore: 52,
    reasoning: "Initial customer adoption might be slower than projected due to EV charging behavior education requirements in tier-2 cities.",
    indicators: ["Low active session time", "High churn in monthly trials"],
    mitigation: "Deploy localized product education campaigns and onboarding subsidies."
  },
  competitionRisk: {
    probability: 70,
    impact: 75,
    severity: "HIGH" as const,
    riskScore: 53,
    reasoning: "Strong incumbents like Ather Grid and Tata Power have capital advantage and pre-existing dealership charging spots.",
    indicators: ["Price cuts from competitors", "Exclusivity agreements with prime parking areas"],
    mitigation: "Focus on open API developer SaaS integrations and white-label fleet software."
  },
  financialRisk: {
    probability: 80,
    impact: 90,
    severity: "CRITICAL" as const,
    riskScore: 72,
    reasoning: "Strict ₹2 Lakhs budget constraint severely limits runway and hardware-backed testing capacity.",
    indicators: ["Monthly burn exceeding budget", "Failure to secure pilots in Pune"],
    mitigation: "Operate as pure software/SaaS first; partner with third-party charge point operators (CPOs) for hardware."
  },
  regulatoryRisk: {
    probability: 45,
    impact: 85,
    severity: "MEDIUM" as const,
    riskScore: 38,
    reasoning: "Maharashtra electricity distribution policies or tariff revisions could impact CPO margins and charging pricing model.",
    indicators: ["Changes in DISCOM grid access charges", "Revised FAME-III subsidy conditions"],
    mitigation: "Maintain a dynamic margin buffer and support multi-state expansion to hedge policy changes."
  },
  technologyRisk: {
    probability: 40,
    impact: 70,
    severity: "MEDIUM" as const,
    riskScore: 28,
    reasoning: "High reliance on third-party OCPP (Open Charge Point Protocol) APIs and server infrastructure reliability.",
    indicators: ["API latency > 500ms", "Charger status sync mismatches"],
    mitigation: "Build local caching layers and offline-tolerant charger status syncing."
  },
  operationalRisk: {
    probability: 50,
    impact: 60,
    severity: "MEDIUM" as const,
    riskScore: 30,
    reasoning: "Logistics and procurement delays for charger communication modules could stall testing.",
    indicators: ["Vendor delivery delays exceeding 14 days", "Component defect rate > 3%"],
    mitigation: "Pre-screen multiple local vendors and keep a buffer supply of key hardware boards."
  },
  executionRisk: {
    probability: 50,
    impact: 75,
    severity: "MEDIUM" as const,
    riskScore: 38,
    reasoning: "Core engineering team possesses strong software capability but lacks heavy electrical engineering experience.",
    indicators: ["Integration milestone delays", "High reliance on freelance hardware consultants"],
    mitigation: "Hire a senior advisor from the power utility sector and utilize standard pre-certified hardware."
  },
  fundingRisk: {
    probability: 75,
    impact: 80,
    severity: "HIGH" as const,
    riskScore: 60,
    reasoning: "Hard fundraising environment for hardware-connected startups in seed stages.",
    indicators: ["Low response rate from institutional investors", "No term sheet offers within 4 months"],
    mitigation: "Establish strong software-only revenue early to demonstrate cash flow independence."
  },
  overallRiskIndex: {
    score: 47,
    severity: "MEDIUM" as const,
    reasoning: [
      "Financial Risk is CRITICAL (Score: 72) - Limited starting capital constraints runway.",
      "Funding Risk is HIGH (Score: 60) - Capital intensity vs fundraising challenges.",
      "Competition Risk is HIGH (Score: 53) - Established giants Ather and Tata hold dealership real estate advantage."
    ]
  },
  mitigationStrategies: [
    {
      riskDimension: "Financial Risk",
      description: "Severe starting capital constraints and high capital requirements",
      preventiveActions: [
        "Avoid buying physical chargers; partner with existing CPOs.",
        "Launch with a SaaS-only billing model for fleet owners first."
      ],
      contingencyPlans: [
        "Secure pre-paid software contract commitments from fleet companies.",
        "Raise seed bridge capital from regional angel syndicates."
      ]
    },
    {
      riskDimension: "Competition Risk",
      description: "Incumbents dominating prime physical locations",
      preventiveActions: [
        "Position as an aggregator software overlay rather than competing on charger stations.",
        "Integrate with open network protocols (OCPP 1.6/2.0.1)."
      ],
      contingencyPlans: [
        "Pivot focus to long-haul logistics fleets who use dedicated private yards.",
        "License white-label billing platform to smaller tier-3 regional chargers."
      ]
    }
  ]
};

const severityStyles = {
  LOW: {
    color: "#22c55e",
    bg: "rgba(34, 197, 94, 0.08)",
    border: "rgba(34, 197, 94, 0.2)"
  },
  MEDIUM: {
    color: "#eab308",
    bg: "rgba(234, 179, 8, 0.08)",
    border: "rgba(234, 179, 8, 0.2)"
  },
  HIGH: {
    color: "#f97316",
    bg: "rgba(249, 115, 22, 0.08)",
    border: "rgba(249, 115, 22, 0.2)"
  },
  CRITICAL: {
    color: "#ef4444",
    bg: "rgba(239, 68, 68, 0.08)",
    border: "rgba(239, 68, 68, 0.2)"
  }
};

export default function RisksPage() {
  const { projects, activeId } = useProjectStore();
  const activeProject = projects.find((p) => p.id === activeId);

  const report = activeProject?.riskIntel && Object.keys(activeProject.riskIntel).length > 0
    ? activeProject.riskIntel
    : defaultRiskIntel;

  const overall = report.overallRiskIndex || defaultRiskIntel.overallRiskIndex;
  const mitigations = report.mitigationStrategies || defaultRiskIntel.mitigationStrategies;

  const dimensions = [
    { label: "Market Risk", data: report.marketRisk },
    { label: "Competition Risk", data: report.competitionRisk },
    { label: "Financial Risk", data: report.financialRisk },
    { label: "Regulatory Risk", data: report.regulatoryRisk },
    { label: "Technology Risk", data: report.technologyRisk },
    { label: "Operational Risk", data: report.operationalRisk },
    { label: "Execution Risk", data: report.executionRisk },
    { label: "Funding Risk", data: report.fundingRisk },
  ].filter(d => d.data !== undefined);

  const radarData = dimensions.map((d) => ({
    dimension: d.label.replace(" Risk", ""),
    value: typeof d.data?.riskScore === 'number' ? d.data.riskScore : 0,
    severity: d.data?.severity || "MEDIUM"
  }));

  const overallStyle = severityStyles[overall.severity as keyof typeof severityStyles] || severityStyles.MEDIUM;

  return (
    <ProjectGuard>
      <DashboardLayout>
        <div className="p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg" style={{ color: "var(--accent)" }}>⚠</span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(218, 242, 100, 0.1)", color: "var(--accent)" }}>
                  Risk Intelligence Agent · Done
                </span>
              </div>
              <h1 className="text-2xl font-bold text-white">Risk Intelligence & Due Diligence</h1>
              <p className="text-sm mt-1" style={{ color: "var(--muted-fg)" }}>
                {activeProject?.name || "EV Startup Platform"} · 8 dimensions evaluated programmatically
              </p>
            </div>
            <button className="text-xs px-3 py-2 rounded-lg font-medium"
              style={{ background: "var(--accent)", color: "#0a0a0a" }}>
              ↓ Export Risk Assessment
            </button>
          </div>

          {/* Overall Risk Index Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 rounded-2xl p-6 flex flex-col items-center justify-center text-center"
              style={{ background: overallStyle.bg, border: `1px solid ${overallStyle.border}` }}>
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-36 h-36 -rotate-90">
                  <circle cx="72" cy="72" r="62" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="12" />
                  <circle cx="72" cy="72" r="62" fill="none" stroke={overallStyle.color} strokeWidth="12"
                    strokeDasharray={`${(overall.score / 100) * 389} 389`}
                    strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-bold" style={{ color: overallStyle.color }}>{overall.score}</span>
                  <span className="text-xs font-semibold" style={{ color: "var(--muted-fg)" }}>/ 100</span>
                </div>
              </div>
              <p className="text-base font-bold mt-4 text-white">Overall Risk Index</p>
              <span className="text-xs font-bold px-3 py-1 rounded-full mt-2"
                style={{ background: "rgba(0,0,0,0.2)", color: overallStyle.color, border: `1px solid ${overallStyle.border}` }}>
                {overall.severity} SEVERITY
              </span>
            </div>

            <div className="lg:col-span-2 rounded-2xl p-6 flex flex-col justify-between"
              style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
              <div>
                <h3 className="text-sm font-semibold text-white mb-3">Principal Risk Analyst Diagnostics</h3>
                <div className="space-y-3">
                  {Array.isArray(overall?.reasoning) ? overall.reasoning.map((reason: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 text-xs leading-relaxed text-white">
                      <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                        style={{
                          background: typeof reason === 'string' && reason.includes("CRITICAL") ? "#ef4444" :
                                      typeof reason === 'string' && reason.includes("HIGH") ? "#f97316" :
                                      typeof reason === 'string' && reason.includes("MEDIUM") ? "#eab308" : "#22c55e"
                        }} />
                      <span>{typeof reason === 'string' ? reason : JSON.stringify(reason)}</span>
                    </div>
                  )) : typeof overall?.reasoning === 'string' ? (
                    <div className="flex items-start gap-3 text-xs leading-relaxed text-white">
                      <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 bg-yellow-400" />
                      <span>{overall.reasoning}</span>
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="pt-4 border-t" style={{ borderColor: "var(--card-border)" }}>
                <p className="text-xs" style={{ color: "var(--muted-fg)" }}>
                  💡 <span className="font-semibold text-white">Note:</span> VentureIQ programmatically computes overall risk as the mathematical average of the 8 dimensions. Dimensions with scores &gt; 50 trigger priority mitigations.
                </p>
              </div>
            </div>
          </div>

          {/* Risk Heatmap/Radar + Dimension Scores */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 rounded-xl p-5" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
              <h3 className="text-sm font-semibold text-white mb-4">Risk Exposure Radar</h3>
              <div className="w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#222" />
                    <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 9, fill: "#888" }} />
                    <Radar dataKey="value" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.1} />
                    <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, fontSize: 11 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-2 rounded-xl p-5 space-y-4" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
              <h3 className="text-sm font-semibold text-white mb-2">Risk Dimension Scores</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dimensions.map((d: any) => {
                  const style = severityStyles[d.data.severity as keyof typeof severityStyles] || severityStyles.MEDIUM;
                  return (
                    <div key={d.label} className="rounded-lg p-3 border" style={{ background: "rgba(255,255,255,0.01)", borderColor: "var(--card-border)" }}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-xs text-white">{d.label}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: style.bg, color: style.color }}>
                          {d.data.severity} ({d.data.riskScore})
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                        <div className="h-full rounded-full" style={{ width: `${d.data.riskScore}%`, background: style.color }} />
                      </div>
                      <div className="flex justify-between text-[9px] mt-1" style={{ color: "var(--muted-fg)" }}>
                        <span>Probability: {d.data.probability}%</span>
                        <span>Impact: {d.data.impact}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Detailed Dimensions Analysis */}
          <div>
            <h3 className="font-semibold text-sm text-white mb-3">Grounded Risk Diagnostics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dimensions.map((d: any) => {
                const style = severityStyles[d.data.severity as keyof typeof severityStyles] || severityStyles.MEDIUM;
                return (
                  <motion.div key={d.label} whileHover={{ y: -2 }} className="rounded-xl p-5"
                    style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold text-sm text-white">{d.label}</h4>
                        <p className="text-[10px] mt-0.5" style={{ color: "var(--muted-fg)" }}>
                          Likelihood: {d.data.probability}% · Damage Impact: {d.data.impact}%
                        </p>
                      </div>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: style.bg, color: style.color, border: `1px solid ${style.border}` }}>
                        {d.data.severity}
                      </span>
                    </div>

                    <p className="text-xs leading-relaxed text-white mb-4">
                      {d.data.reasoning}
                    </p>

                    {/* Early warning indicators */}
                    {d.data && Array.isArray(d.data.indicators) && d.data.indicators.length > 0 && (
                      <div className="mb-4">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Early Warning Indicators</span>
                        <ul className="mt-1 space-y-1">
                          {d.data.indicators.map((ind: string, i: number) => (
                            <li key={i} className="text-xs flex items-center gap-2" style={{ color: "var(--muted-fg)" }}>
                              <span className="text-amber-500">•</span>
                              {ind}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Primary Mitigation Action */}
                    <div className="p-3 rounded-lg" style={{ background: "rgba(218, 242, 100, 0.03)", border: "1px dashed rgba(218, 242, 100, 0.15)" }}>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-green-400">Primary Mitigation</span>
                      <p className="text-xs mt-1 text-white leading-relaxed">
                        {d.data.mitigation}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Mitigation Strategies Panel */}
          {Array.isArray(mitigations) && mitigations.length > 0 && (
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--card-border)" }}>
              <div className="px-5 py-4" style={{ background: "var(--card-bg)", borderBottom: "1px solid var(--card-border)" }}>
                <h3 className="font-semibold text-sm text-white">VC Mitigation & Contingency Engine</h3>
              </div>
              <div className="p-6 space-y-6" style={{ background: "var(--background)" }}>
                {mitigations.map((m: any, idx: number) => {
                  if (!m || typeof m !== 'object') return null;
                  return (
                    <div key={idx} className="pb-6 last:pb-0 border-b last:border-0" style={{ borderColor: "var(--card-border)" }}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                          style={{ background: "rgba(218, 242, 100, 0.1)", color: "var(--accent)" }}>
                          {m.riskDimension}
                        </span>
                        <span className="text-xs text-white font-medium">— {m.description}</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                        <div className="rounded-lg p-4" style={{ background: "rgba(255,255,255,0.01)", border: "1px solid var(--card-border)" }}>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-green-400">Preventive Actions</span>
                          <ul className="mt-2 space-y-1.5">
                            {Array.isArray(m.preventiveActions) && m.preventiveActions.map((act: string, i: number) => (
                              <li key={i} className="text-xs flex items-start gap-2 text-white">
                                <span className="text-green-400 mt-0.5">✓</span>
                                <span>{act}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="rounded-lg p-4" style={{ background: "rgba(255,255,255,0.01)", border: "1px solid var(--card-border)" }}>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Contingency Plans</span>
                          <ul className="mt-2 space-y-1.5">
                            {Array.isArray(m.contingencyPlans) && m.contingencyPlans.map((plan: string, i: number) => (
                              <li key={i} className="text-xs flex items-start gap-2 text-white">
                                <span className="text-amber-500 mt-0.5">↳</span>
                                <span>{plan}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProjectGuard>
  );
}
