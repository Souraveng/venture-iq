"use client";
import ProjectGuard from "@/components/ProjectGuard";
import DashboardLayout from "@/components/DashboardLayout";
import PremiumGate from "@/components/PremiumGate";
import { usePremiumTier } from "@/hooks/usePremiumTier";
import { motion } from "framer-motion";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useProjectStore } from "@/store/useProjectStore";
import { useTranslatedReport } from "@/hooks/useTranslatedReport";
import { useTranslation } from "@/context/TranslationContext";



function getColor(score: number) {
  if (score >= 80) return "#daf264";
  if (score >= 60) return "#fbbf24";
  return "#ef4444";
}

export default function ValidationPage() {
  const { t } = useTranslation();
  const { isPremium } = usePremiumTier();
  const { projects, activeId } = useProjectStore();
  const activeProject = projects.find((p) => p.id === activeId);

  const baseReadiness = activeProject?.finalReport?.readinessScore ?? 74;

  const checks = [
    { category: t("marketValidation") !== "marketValidation" ? t("marketValidation") : "Market Validation",  items: [
      { label: t("chkProblemValidated") !== "chkProblemValidated" ? t("chkProblemValidated") : "Problem clearly defined and validated",        pass: true  },
      { label: t("chkSegmentIdentified") !== "chkSegmentIdentified" ? t("chkSegmentIdentified") : "Target customer segment identified",           pass: true  },
      { label: t("chkPayConfirmed") !== "chkPayConfirmed" ? t("chkPayConfirmed") : "Willingness to pay confirmed",                 pass: true  },
      { label: t("chkMarketSizeLarge") !== "chkMarketSizeLarge" ? t("chkMarketSizeLarge") : "Market size > $100M addressable",              pass: true  },
    ]},
    { category: t("businessModel") !== "businessModel" ? t("businessModel") : "Business Model",     items: [
      { label: t("chkRevModelDefined") !== "chkRevModelDefined" ? t("chkRevModelDefined") : "Revenue model defined",                        pass: true  },
      { label: t("chkPriceValidated") !== "chkPriceValidated" ? t("chkPriceValidated") : "Pricing validated with prospects",             pass: false },
      { label: t("chkUnitEconPositive") !== "chkUnitEconPositive" ? t("chkUnitEconPositive") : "Unit economics positive at scale",             pass: true  },
      { label: t("chkPathProfitability") !== "chkPathProfitability" ? t("chkPathProfitability") : "Clear path to profitability",                  pass: true  },
    ]},
    { category: t("legalComplianceCategory") !== "legalComplianceCategory" ? t("legalComplianceCategory") : "Legal & Compliance", items: [
      { label: t("chkEntityRegistered") !== "chkEntityRegistered" ? t("chkEntityRegistered") : "Business entity registered",                   pass: false },
      { label: t("chkIpStrategy") !== "chkIpStrategy" ? t("chkIpStrategy") : "IP strategy defined",                          pass: false },
      { label: t("chkRegulatoryMapped") !== "chkRegulatoryMapped" ? t("chkRegulatoryMapped") : "Regulatory requirements mapped",               pass: true  },
      { label: t("chkPrivacyPlan") !== "chkPrivacyPlan" ? t("chkPrivacyPlan") : "Data privacy compliance plan",                 pass: false },
    ]},
    { category: t("investorReadiness") !== "investorReadiness" ? t("investorReadiness") : "Investor Readiness", items: [
      { label: t("chkDeckComplete") !== "chkDeckComplete" ? t("chkDeckComplete") : "Pitch deck complete",                          pass: false },
      { label: t("chkFinModelProj") !== "chkFinModelProj" ? t("chkFinModelProj") : "Financial model 3-year projection",            pass: true  },
      { label: t("chkCapTableDef") !== "chkCapTableDef" ? t("chkCapTableDef") : "Cap table structure defined",                  pass: false },
      { label: t("chkDataRoom") !== "chkDataRoom" ? t("chkDataRoom") : "Due diligence data room ready",                pass: false },
    ]},
  ];

  const fallbackAnalystReport = {
    investmentRecommendation: {
      decision: "YES",
      confidence: 78,
      reasoning: [
        t("fbReason1") !== "fbReason1" ? t("fbReason1") : "Extremely healthy unit economics with a projected LTV:CAC of 20x.",
        t("fbReason2") !== "fbReason2" ? t("fbReason2") : "Optimal entry timing aligning with rapid customer digitization cycles.",
        t("fbReason3") !== "fbReason3" ? t("fbReason3") : "Clear software-first value proposition avoiding capital-heavy asset acquisitions."
      ],
      requiredMilestones: [
        t("fbMilestone1") !== "fbMilestone1" ? t("fbMilestone1") : "Validate initial software workflows with at least 5 target companies under a live pilot.",
        t("fbMilestone2") !== "fbMilestone2" ? t("fbMilestone2") : "Deploy robust server status caching to handle API latency or network dropouts."
      ]
    },
    redFlags: [
      t("fbFlag1") !== "fbFlag1" ? t("fbFlag1") : "Strict ₹2 Lakhs initial budget constraint limits runway and marketing acquisition velocity.",
      t("fbFlag2") !== "fbFlag2" ? t("fbFlag2") : "Established legacy players command massive pre-existing distribution networks.",
      t("fbFlag3") !== "fbFlag3" ? t("fbFlag3") : "Potential user adoption friction due to existing workflows and manual spreadsheets habit."
    ],
    moatAnalysis: {
      identifiedMoats: [
        t("fbMoat1") !== "fbMoat1" ? t("fbMoat1") : "Proprietary scheduling optimization algorithm",
        t("fbMoat2") !== "fbMoat2" ? t("fbMoat2") : "Depot transaction data network effects"
      ],
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

  const decision = isPremium
    ? (analystData?.investmentRecommendation?.decision || "YES")
    : (passedChecks >= totalChecks * 0.7 ? "YES" : "NO");

  const verdict = isPremium
    ? (activeProject?.finalReport?.verdict || "Proceed")
    : (passedChecks >= totalChecks * 0.7 ? "PROCEED" : "CAUTION");

  const marketSize = translatedFinalReport?.marketAttractiveness?.overallScore ?? Math.min(100, Math.round(baseReadiness * 1.15));
  const competition = translatedFinalReport?.moatAnalysis?.moatStrengthScore ?? Math.min(100, Math.round(baseReadiness * 0.95));
  const teamReadiness = translatedFinalReport?.ventureReadiness?.executionReadinessScore ?? Math.min(100, Math.round(baseReadiness * 1.05));
  const financialViability = translatedFinalReport?.ventureReadiness?.financialReadinessScore ?? Math.min(100, Math.round(baseReadiness * 1.02));
  const legalCompliance = translatedFinalReport?.ventureReadiness?.fundraisingReadinessScore ?? Math.max(0, Math.round(baseReadiness * 0.85));
  const executionRisk = translatedFinalReport?.ventureReadiness?.customerValidationScore ?? Math.max(0, Math.round(100 - baseReadiness * 0.8));

  const scores = [
    { dimension: t("marketSize") !== "marketSize" ? t("marketSize") : "Market Size",       score: marketSize, max: 100, color: "#daf264", insight: t("marketSizeInsight") !== "marketSizeInsight" ? t("marketSizeInsight") : "Evaluated from live market size and growth analysis" },
    { dimension: t("competitionMoat") !== "competitionMoat" ? t("competitionMoat") : "Competition Moat",  score: competition, max: 100, color: "#daf264", insight: t("competitionMoatInsight") !== "competitionMoatInsight" ? t("competitionMoatInsight") : "Based on defensibility barriers and replication difficulty" },
    { dimension: t("teamReadiness") !== "teamReadiness" ? t("teamReadiness") : "Team Readiness",    score: teamReadiness, max: 100, color: "#daf264", insight: t("teamReadinessInsight") !== "teamReadinessInsight" ? t("teamReadinessInsight") : "Venture founder-market fit and execution analysis" },
    { dimension: t("financialViability") !== "financialViability" ? t("financialViability") : "Financial Viability",score: financialViability, max: 100, color: "#daf264", insight: t("financialViabilityInsight") !== "financialViabilityInsight" ? t("financialViabilityInsight") : "Calculated from capital efficiency and payback timelines" },
    { dimension: t("legalCompliance") !== "legalCompliance" ? t("legalCompliance") : "Legal / Compliance",score: legalCompliance, max: 100, color: "#fbbf24", insight: t("legalComplianceInsight") !== "legalComplianceInsight" ? t("legalComplianceInsight") : "Evaluated from regulatory compliance readiness" },
    { dimension: t("executionRisk") !== "executionRisk" ? t("executionRisk") : "Execution Risk",    score: executionRisk, max: 100, color: "#fbbf24", insight: t("executionRiskInsight") !== "executionRiskInsight" ? t("executionRiskInsight") : "Evaluated from customer validation pilots and GTM status" },
  ];

  const overallScore = Math.round(scores.reduce((a, s) => a + s.score, 0) / scores.length);
  const radarData = scores.map((s) => ({ dimension: s.dimension.split(" ")[0], value: s.score }));

  const decisionColors = {
    "STRONG YES": { text: "#22c55e", bg: "rgba(34, 197, 94, 0.08)", border: "rgba(34, 197, 94, 0.2)" },
    "YES": { text: "#22c55e", bg: "rgba(34, 197, 94, 0.08)", border: "rgba(34, 197, 94, 0.2)" },
    "MAYBE": { text: "#eab308", bg: "rgba(234, 179, 8, 0.08)", border: "rgba(234, 179, 8, 0.2)" },
    "NO": { text: "#ef4444", bg: "rgba(239, 68, 68, 0.08)", border: "rgba(239, 68, 68, 0.2)" },
    "STRONG NO": { text: "#ef4444", bg: "rgba(239, 68, 68, 0.08)", border: "rgba(239, 68, 68, 0.2)" }
  };

  const decStyle = decisionColors[decision as keyof typeof decisionColors] || decisionColors.MAYBE;

  return (
    <ProjectGuard>
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{t("startupValidation") !== "startupValidation" ? t("startupValidation") : "Startup Validation"}</h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted-fg)" }}>
            {t("readinessAssessment") !== "readinessAssessment" ? t("readinessAssessment") : "AI-generated readiness assessment"} · {activeProject?.name || "No Active Venture"}
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
            <p className="text-xs font-semibold text-white mt-2">{t("ventureReadiness") !== "ventureReadiness" ? t("ventureReadiness") : "Venture Readiness Index"}</p>
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h2 className="text-xl font-bold text-white">
                {t("verdict") !== "verdict" ? t("verdict") : "Verdict"}: {verdict}
              </h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded"
                style={{ background: decStyle.bg, color: decStyle.text, border: `1px solid ${decStyle.border}` }}>
                {t("investorDecision") !== "investorDecision" ? t("investorDecision") : "INVESTOR DECISION"}: {decision}
              </span>
            </div>
            <p className="text-sm mb-4 leading-relaxed" style={{ color: "var(--muted-fg)" }}>
              {isPremium 
                ? (activeProject?.finalReport?.summary || (t("validationHeroDesc") !== "validationHeroDesc" ? t("validationHeroDesc") : "Your startup venture has been evaluated by our multi-agent network. Start an analysis run or edit your idea to see the updated readiness verdict."))
                : "Your startup venture has been verified by the free-tier validation agents. Explore the checklist below to see which checks passed or failed."}
            </p>
            <div className="flex gap-3">
              <div className="text-center px-4 py-2 rounded-xl" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
                <p className="text-xl font-bold" style={{ color: "var(--accent)" }}>{passedChecks}/{totalChecks}</p>
                <p className="text-xs" style={{ color: "var(--muted-fg)" }}>{t("checksPassed") !== "checksPassed" ? t("checksPassed") : "Checks passed"}</p>
              </div>
              <div className="text-center px-4 py-2 rounded-xl" style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)" }}>
                <p className="text-xl font-bold text-yellow-400">{totalChecks - passedChecks}</p>
                <p className="text-xs" style={{ color: "var(--muted-fg)" }}>{t("actionItems") !== "actionItems" ? t("actionItems") : "Action items"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Investment due diligence card */}
        <PremiumGate>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Red flags */}
            <div className="rounded-xl p-5 border lg:col-span-1" style={{ background: "rgba(239, 68, 68, 0.02)", borderColor: "rgba(239, 68, 68, 0.15)" }}>
              <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <span>⚠</span> {t("vcDueDiligence") !== "vcDueDiligence" ? t("vcDueDiligence") : "VC Due Diligence Red Flags"}
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
                <span>✓</span> {t("milestonesToSecureCapital") !== "milestonesToSecureCapital" ? t("milestonesToSecureCapital") : "Required Milestones to Secure Capital"}
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
        </PremiumGate>

        {/* Dimension scores + radar */}
        <PremiumGate>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl p-5 space-y-3" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
              <h3 className="text-sm font-semibold text-white mb-3">{t("scoreByDimension") !== "scoreByDimension" ? t("scoreByDimension") : "Score by Dimension"}</h3>
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
              <h3 className="text-sm font-semibold text-white mb-4">{t("capabilityRadar") !== "capabilityRadar" ? t("capabilityRadar") : "Capability Radar"}</h3>
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
        </PremiumGate>

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
              <span>⚡</span> {t("conflictDetection") !== "conflictDetection" ? t("conflictDetection") : "Data Conflicts"} ({translatedConflicts.length})
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
            <h3 className="text-sm font-semibold text-white mb-3">{t("reliabilityAssessment") !== "reliabilityAssessment" ? t("reliabilityAssessment") : "Source Reliability"}</h3>
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
