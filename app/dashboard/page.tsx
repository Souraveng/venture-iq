"use client";
import DashboardLayout from "@/components/DashboardLayout";
import EditProjectPanel from "@/components/EditProjectPanel";
import ProjectGuard from "@/components/ProjectGuard";
import { useState } from "react";
import { motion } from "framer-motion";
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from "recharts";
import { useProjectStore } from "@/store/useProjectStore";

const agentStatus = [
  { name: "Market Research", icon: "◎", status: "done",    output: "Market Analysis Report", time: "2m 14s" },
  { name: "Competitor Analysis", icon: "⬡", status: "done", output: "Competitor Matrix + SWOT", time: "3m 02s" },
  { name: "Finance Agent",   icon: "◆", status: "running", output: "Revenue Forecast in progress…", time: "—" },
  { name: "Legal Agent",     icon: "≡", status: "waiting", output: "Waiting for Finance Agent", time: "—" },
  { name: "Pitch Deck",      icon: "✦", status: "waiting", output: "Waiting for Legal Agent", time: "—" },
];

const statusStyle = {
  done:    { color: "#daf264", bg: "rgba(218, 242, 100, 0.08)",  label: "Done"    },
  running: { color: "#daf264", bg: "rgba(218, 242, 100, 0.15)",  label: "Running" },
  waiting: { color: "#444",    bg: "rgba(255,255,255,0.03)", label: "Waiting" },
};

function ScoreGauge({ label, value, color }: { label: string; value: number; color: string }) {
  const data = [{ value, fill: color }];
  return (
    <div className="rounded-xl p-4 flex flex-col items-center"
      style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
      <div style={{ width: 100, height: 100, position: "relative" }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart innerRadius={32} outerRadius={46} data={data} startAngle={90} endAngle={-270}>
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar background={{ fill: "#222" }} dataKey="value" cornerRadius={8} angleAxisId={0} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold" style={{ color }}>{value}</span>
        </div>
      </div>
      <p className="text-xs text-center mt-2" style={{ color: "var(--muted-fg)" }}>{label}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { projects, activeId, updateProject } = useProjectStore();
  const activeProject = projects.find((p) => p.id === activeId)!;
  const [editOpen, setEditOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const decReport = activeProject?.decisionReport || null;
  const readiness = decReport ? decReport.ventureReadiness.score : (activeProject?.finalReport?.readinessScore ?? 74);
  const opportunity = decReport ? decReport.opportunityScore.score : 85;
  const risk = activeProject?.riskIntel?.overallRiskIndex?.score ?? 32;
  const confidence = decReport ? decReport.confidence.score : 82;

  const scores = [
    { label: "Venture Readiness", value: readiness, color: "#daf264" },
    { label: "Opportunity Score", value: opportunity, color: "#daf264" },
    { label: "Overall Risk Index", value: risk, color: risk > 50 ? "#ef4444" : "#daf264" },
    { label: "Data Confidence",    value: confidence, color: "#daf264" },
  ];

  async function handleRerun() {
    setLoading(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "full",
          data: {
            name: activeProject.name,
            description: activeProject.description,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Rerun failed");
      }

      const result = await response.json();
      console.log("Rerun result:", result);

      updateProject(activeId, {
        marketIntel: result.marketIntel || {},
        competitorIntel: result.competitorIntel || {},
        swotIntel: result.swotIntel || {},
        riskIntel: result.riskIntel || {},
        financialIntel: result.financialIntel || {},
        finalReport: result.finalReport || {},
        roadmapIntel: result.roadmapIntel || {},
        decisionReport: result.decisionReport || {},
        reportIntel: result.reportIntel || {},
        researchPlan: result.researchPlan || [],
        agentsDone: 5,
        progress: 100,
      });
    } catch (e) {
      console.error("Failed to rerun:", e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ProjectGuard>
    <DashboardLayout>
      <div className="p-8 space-y-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-sm" style={{ color: "var(--muted-fg)" }}>Good morning, Founder.</p>
          <h1 className="text-2xl font-bold mt-0.5 text-white">Startup Builder Overview</h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted-fg)" }}>
            Building: <span className="font-semibold" style={{ color: "var(--accent)" }}>{activeProject.name}</span>
            &nbsp;·&nbsp; {loading ? "Re-running pipeline..." : `${activeProject.agentsDone} of ${activeProject.totalAgents} agents completed`}
          </p>
        </motion.div>

        {/* Idea strip */}
        <div className="flex items-center gap-3 rounded-xl p-4"
          style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold"
            style={{ background: "var(--accent)", color: "#0a0a0a" }}>
            {activeProject.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{activeProject.name}</p>
            <p className="text-xs truncate" style={{ color: "var(--muted-fg)" }}>{activeProject.description}</p>
          </div>
          <button
            onClick={() => setEditOpen(true)}
            className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors hover:opacity-80"
            style={{ background: "rgba(218,242,100,0.1)", color: "var(--accent)", border: "1px solid rgba(218,242,100,0.2)" }}>
            ✎ Edit idea
          </button>
          <button 
            onClick={handleRerun}
            disabled={loading}
            className="text-xs px-3 py-1.5 rounded-lg font-medium text-white transition-opacity disabled:opacity-50"
            style={{ background: "var(--accent)", color: "#0a0a0a" }}>
            {loading ? "Running..." : "⟳ Re-run all"}
          </button>
        </div>

        {/* Score gauges */}
        <div>
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--muted-fg)" }}>Startup Validation Scores</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {scores.map((s) => <ScoreGauge key={s.label} {...s} />)}
          </div>
        </div>

        {/* Dynamic Investment Committee Report */}
        {decReport ? (
          <div className="space-y-6">
            
            {/* Verdict Banner */}
            <div className="rounded-2xl p-6 border transition-all"
              style={{
                background: 
                  decReport.verdict.decision.includes("STRONG") || decReport.verdict.decision === "PROCEED"
                    ? "rgba(34, 197, 94, 0.04)"
                    : decReport.verdict.decision.includes("CAUTION")
                    ? "rgba(234, 179, 8, 0.04)"
                    : "rgba(239, 68, 68, 0.04)",
                borderColor:
                  decReport.verdict.decision.includes("STRONG") || decReport.verdict.decision === "PROCEED"
                    ? "rgba(34, 197, 94, 0.2)"
                    : decReport.verdict.decision.includes("CAUTION")
                    ? "rgba(234, 179, 8, 0.2)"
                    : "rgba(239, 68, 68, 0.2)"
              }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest"
                  style={{
                    color:
                      decReport.verdict.decision.includes("STRONG") || decReport.verdict.decision === "PROCEED"
                        ? "#22c55e"
                        : decReport.verdict.decision.includes("CAUTION")
                        ? "#eab308"
                        : "#ef4444"
                  }}>
                  INVESTMENT VERDICT
                </span>
                <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-black/40 border border-white/5">
                  STAGE: {decReport.ventureReadiness.stage}
                </span>
              </div>
              <h2 className="text-2xl font-black text-white">
                {decReport.verdict.decision}
              </h2>
              <ul className="space-y-2 mt-3 pl-1">
                {(decReport.verdict.reasoning || []).map((r: string, i: number) => (
                  <li key={i} className="text-xs text-gray-300 leading-relaxed flex items-start gap-2">
                    <span className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-white/45" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Executive Summary */}
            <div className="rounded-2xl p-6 border border-[var(--card-border)] bg-[var(--card-bg)]">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">Executive Summary</h3>
              <p className="text-xs leading-relaxed text-gray-300 whitespace-pre-line">
                {decReport.executiveSummary}
              </p>
            </div>

            {/* Opportunities vs Risks columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Opportunities */}
              <div className="rounded-2xl p-6 border border-[var(--card-border)] bg-[var(--card-bg)] space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <span>◎</span> Key Opportunities
                </h3>
                <ul className="space-y-3">
                  {(decReport.topOpportunities || []).map((o: string, i: number) => (
                    <li key={i} className="text-xs text-gray-300 leading-relaxed flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 font-bold flex items-center justify-center flex-shrink-0 text-[10px]">
                        {i + 1}
                      </span>
                      <span>{o}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Risks */}
              <div className="rounded-2xl p-6 border border-[var(--card-border)] bg-[var(--card-bg)] space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-red-400 flex items-center gap-2">
                  <span>⚠</span> Key Risks
                </h3>
                <ul className="space-y-3">
                  {(decReport.topRisks || []).map((r: string, i: number) => (
                    <li key={i} className="text-xs text-gray-300 leading-relaxed flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-red-950 text-red-400 font-bold flex items-center justify-center flex-shrink-0 text-[10px]">
                        {i + 1}
                      </span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>

            {/* Recommended Next Actions */}
            <div className="rounded-2xl p-6 border border-[var(--card-border)] bg-[var(--card-bg)] space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--accent)]">
                Recommended Action Plan
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(decReport.recommendedActions || []).map((action: string, i: number) => (
                  <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl border border-[var(--card-border)] bg-black/20">
                    <span className="w-4 h-4 rounded bg-[rgba(218,242,100,0.1)] border border-[rgba(218,242,100,0.2)] text-[var(--accent)] flex items-center justify-center flex-shrink-0 text-[10px] mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-xs text-gray-300 leading-relaxed">{action}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        ) : (
          /* Fallback Basic Summary if not analyzed yet */
          activeProject?.finalReport?.summary && (
            <div className="rounded-xl p-5" style={{ background: "rgba(218, 242, 100, 0.05)", border: "1px solid rgba(218, 242, 100, 0.15)" }}>
              <h2 className="text-sm font-semibold mb-2 text-white">AI Agent Executive Summary (Live Graph Output)</h2>
              <p className="text-xs leading-relaxed" style={{ color: "var(--muted-fg)" }}>
                {activeProject.finalReport.summary}
              </p>
            </div>
          )
        )}

        {/* Agent pipeline */}
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--card-border)" }}>
          <div className="px-5 py-4 flex items-center justify-between"
            style={{ background: "var(--card-bg)", borderBottom: "1px solid var(--card-border)" }}>
            <h2 className="text-sm font-semibold">Agent Pipeline</h2>
            <span className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{ background: "rgba(218, 242, 100, 0.1)", color: "var(--accent)" }}>
              ● Live
            </span>
          </div>
          <div style={{ background: "var(--background)" }}>
            {agentStatus.map((agent, i) => {
              const s = statusStyle[agent.status as keyof typeof statusStyle];
              return (
                <motion.div key={agent.name}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                  className="flex items-center gap-4 px-5 py-4 border-b last:border-0"
                  style={{ borderColor: "var(--card-border)" }}>
                  {/* Step number */}
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: agent.status === "done" ? "rgba(218, 242, 100, 0.15)" : "var(--card-bg)", color: agent.status === "done" ? "var(--accent)" : "#444", border: "1px solid var(--card-border)" }}>
                    {agent.status === "done" ? "✓" : i + 1}
                  </div>

                  {/* Icon */}
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                    style={{ background: s.bg, color: s.color }}>
                    {agent.icon}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{agent.name}</p>
                    <p className="text-xs truncate" style={{ color: "var(--muted-fg)" }}>{agent.output}</p>
                  </div>

                  {/* Time */}
                  {agent.time !== "—" && (
                    <span className="text-xs" style={{ color: "var(--muted-fg)" }}>{agent.time}</span>
                  )}

                  {/* Status badge */}
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0"
                    style={{ background: s.bg, color: s.color }}>
                    {agent.status === "running" && <span className="mr-1 inline-block w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
                    {s.label}
                  </span>

                  {/* Action */}
                  {agent.status === "done" && (
                    <button className="text-xs px-2.5 py-1 rounded-lg flex-shrink-0"
                      style={{ background: "rgba(218, 242, 100, 0.08)", color: "var(--accent)", border: "1px solid rgba(218, 242, 100, 0.15)" }}>
                      View →
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Quick outputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { title: "Market Size (TAM)", value: "$2.4T", sub: "Global EV market by 2030", icon: "◎" },
            { title: "Top Competitor", value: "Ather Energy", sub: "Direct · India market leader", icon: "⬡" },
            { title: "Funding Required", value: "$4.2M", sub: "Seed round estimate", icon: "◆" },
          ].map((item) => (
            <motion.div key={item.title} whileHover={{ y: -2 }}
              className="rounded-xl p-4"
              style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg" style={{ color: "var(--accent)" }}>{item.icon}</span>
                <span className="text-xs" style={{ color: "var(--muted-fg)" }}>{item.title}</span>
              </div>
              <p className="text-2xl font-bold text-white">{item.value}</p>
              <p className="text-xs mt-1" style={{ color: "var(--muted-fg)" }}>{item.sub}</p>
            </motion.div>
          ))}
        </div>

        {activeProject?.finalReport?.financialProjection && (
          <div className="rounded-xl p-5" style={{ background: "rgba(218, 242, 100, 0.03)", border: "1px solid var(--card-border)" }}>
            <h2 className="text-sm font-semibold mb-2 text-white">AI Financial Evaluation & Capital Allocation</h2>
            <p className="text-xs leading-relaxed" style={{ color: "var(--muted-fg)" }}>
              {activeProject.finalReport.financialProjection}
            </p>
          </div>
        )}
      </div>

      {/* Edit project slide-over */}
      <EditProjectPanel open={editOpen} onClose={() => setEditOpen(false)} />
    </DashboardLayout>
    </ProjectGuard>
  );
}
