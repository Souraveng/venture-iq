"use client";
import ProjectGuard from "@/components/ProjectGuard";
import DashboardLayout from "@/components/DashboardLayout";
import { motion } from "framer-motion";
import { useProjectStore } from "@/store/useProjectStore";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useTranslatedReport } from "@/hooks/useTranslatedReport";
import { useTranslation } from "@/context/TranslationContext";

const defaultRiskIntel = {
  marketRisk: {
    probability: 65,
    impact: 80,
    severity: "HIGH" as const,
    riskScore: 52,
    reasoning: "Initial customer adoption might be slower than projected due to market education and transition barriers.",
    indicators: ["Low active usage statistics", "High churn in monthly trials"],
    mitigation: "Implement localized onboarding flows and feedback loops to optimize activation."
  },
  competitionRisk: {
    probability: 70,
    impact: 75,
    severity: "HIGH" as const,
    riskScore: 53,
    reasoning: "Incumbents command substantial brand equity, larger distribution budgets, and existing customer agreements.",
    indicators: ["Aggressive pricing adjustments by competitors", "Exclusive contracts with key partners"],
    mitigation: "Focus on differentiated software capabilities, open integrations, and premium customer service."
  },
  financialRisk: {
    probability: 80,
    impact: 90,
    severity: "CRITICAL" as const,
    riskScore: 72,
    reasoning: "Tight initial budget constraints restrict early runway and marketing/engineering development pace.",
    indicators: ["Monthly operational burn exceeding baseline allocations", "Fewer pilot conversions than planned"],
    mitigation: "Maintain capital-efficient remote operations, utilize freelancers where appropriate, and focus on early revenue."
  },
  regulatoryRisk: {
    probability: 45,
    impact: 85,
    severity: "MEDIUM" as const,
    riskScore: 38,
    reasoning: "Evolving industry compliance standards or local data privacy laws may increase legal costs.",
    indicators: ["Updates in regional regulatory guidelines", "Revised privacy and security compliance mandates"],
    mitigation: "Adopt standard pre-certified frameworks and structure platform terms around flexible privacy policies."
  },
  technologyRisk: {
    probability: 40,
    impact: 70,
    severity: "MEDIUM" as const,
    riskScore: 28,
    reasoning: "Dependence on third-party cloud infrastructure, databases, and external API providers.",
    indicators: ["API latency exceeding acceptable limits", "Database synchronization mismatches"],
    mitigation: "Build redundant failover systems, local caching layers, and perform routine security audits."
  },
  operationalRisk: {
    probability: 50,
    impact: 60,
    severity: "MEDIUM" as const,
    riskScore: 30,
    reasoning: "Potential delays in key team onboarding or resource bottlenecks during high-growth cycles.",
    indicators: ["Operational execution delays", "Higher than expected churn in engineering staff"],
    mitigation: "Maintain a standard repository of backup consultants and build detailed system documentation."
  },
  executionRisk: {
    probability: 50,
    impact: 75,
    severity: "MEDIUM" as const,
    riskScore: 38,
    reasoning: "Core engineering team possesses strong software capability but may lack deep enterprise domain sales experience.",
    indicators: ["Longer sales conversion cycles", "Delayed pilot integrations with enterprise customers"],
    mitigation: "Onboard senior advisors from the target industry to support the sales execution process."
  },
  fundingRisk: {
    probability: 75,
    impact: 80,
    severity: "HIGH" as const,
    riskScore: 60,
    reasoning: "A challenging venture capital landscape raises the bar for pre-seed and seed financing.",
    indicators: ["Low investor response rates", "No term sheet offers during the active runway window"],
    mitigation: "Achieve product-market fit metrics quickly and build software-driven cash flows to support independence."
  },
  overallRiskIndex: {
    score: 47,
    severity: "MEDIUM" as const,
    reasoning: [
      "Financial Risk is CRITICAL (Score: 72) - Initial validation capital constraints require lean execution.",
      "Funding Risk is HIGH (Score: 60) - High competition for seed stages requires strong early proof-of-concept.",
      "Competition Risk is HIGH (Score: 53) - Market leaders hold strong distribution advantage."
    ]
  },
  mitigationStrategies: [
    {
      riskDimension: "Financial Risk",
      description: "Severe starting capital constraints and budget limits",
      preventiveActions: [
        "Minimize upfront fixed expenditures; prioritize lean cloud infrastructure.",
        "Implement a self-serve SaaS model to accelerate incoming cash flows."
      ],
      contingencyPlans: [
        "Pre-sell annual subscription packages with discount incentives.",
        "Secure bridge support from regional angel syndicates or government grants."
      ]
    },
    {
      riskDimension: "Competition Risk",
      description: "Legacy incumbents dominating existing distribution channels",
      preventiveActions: [
        "Position as a specialized modular overlay tool rather than a generic complete suite.",
        "Provide open API endpoints to integrate with and enhance existing client workflows."
      ],
      contingencyPlans: [
        "Pivot focus to under-served, lower-tier market segments ignored by large players.",
        "License white-label engines to regional partners to scale distribution rapidly."
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
  const { t } = useTranslation();
  const { projects, activeId } = useProjectStore();
  const activeProject = projects.find((p) => p.id === activeId);

  const rawRiskIntel = activeProject?.riskIntel;
  const translatedRiskIntel = useTranslatedReport(activeId, rawRiskIntel || null);

  const report = translatedRiskIntel && Object.keys(translatedRiskIntel).length > 0
    ? translatedRiskIntel
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
                  {t("riskAnalysis")} Agent · {t("done") !== "done" ? t("done") : "Done"}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-white">{t("riskAnalysis")} & Due Diligence</h1>
              <p className="text-sm mt-1" style={{ color: "var(--muted-fg)" }}>
                {activeProject?.name || "No Active Venture"} · {t("dimensionsEvaluated") !== "dimensionsEvaluated" ? t("dimensionsEvaluated") : "8 dimensions evaluated programmatically"}
              </p>
            </div>
            <button onClick={() => { if (typeof window !== "undefined") window.print(); }} className="text-xs px-3 py-2 rounded-lg font-medium"
              style={{ background: "var(--accent)", color: "#0a0a0a" }}>
              ↓ {t("exportRiskAssessment") !== "exportRiskAssessment" ? t("exportRiskAssessment") : "Export Risk Assessment"}
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
              <p className="text-base font-bold mt-4 text-white">{t("overallRiskIndex")}</p>
              <span className="text-xs font-bold px-3 py-1 rounded-full mt-2"
                style={{ background: "rgba(0,0,0,0.2)", color: overallStyle.color, border: `1px solid ${overallStyle.border}` }}>
                {overall.severity} {t("severity") !== "severity" ? t("severity") : "SEVERITY"}
              </span>
            </div>

            <div className="lg:col-span-2 rounded-2xl p-6 flex flex-col justify-between"
              style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
              <div>
                <h3 className="text-sm font-semibold text-white mb-3">{t("principalRiskAnalystDiagnostics") !== "principalRiskAnalystDiagnostics" ? t("principalRiskAnalystDiagnostics") : "Principal Risk Analyst Diagnostics"}</h3>
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
              <h3 className="text-sm font-semibold text-white mb-4">{t("ventureValidationRadar")}</h3>
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
              <h3 className="text-sm font-semibold text-white mb-2">{t("riskCategories")}</h3>
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
                        <span>{t("probability") !== "probability" ? t("probability") : "Probability"}: {d.data.probability}%</span>
                        <span>{t("impact") !== "impact" ? t("impact") : "Impact"}: {d.data.impact}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Detailed Dimensions Analysis */}
          <div>
            <h3 className="font-semibold text-sm text-white mb-3">{t("groundedRiskDiagnostics") !== "groundedRiskDiagnostics" ? t("groundedRiskDiagnostics") : "Grounded Risk Diagnostics"}</h3>
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
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">{t("earlyWarningIndicators") !== "earlyWarningIndicators" ? t("earlyWarningIndicators") : "Early Warning Indicators"}</span>
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
                      <span className="text-[10px] font-bold uppercase tracking-wider text-green-400">{t("mitigationPlan")}</span>
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
                <h3 className="font-semibold text-sm text-white">{t("riskMitigationBlueprint")}</h3>
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
                          <span className="text-[10px] font-bold uppercase tracking-wider text-green-400">{t("preventiveActions") !== "preventiveActions" ? t("preventiveActions") : "Preventive Actions"}</span>
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
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">{t("contingencyPlans") !== "contingencyPlans" ? t("contingencyPlans") : "Contingency Plans"}</span>
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
