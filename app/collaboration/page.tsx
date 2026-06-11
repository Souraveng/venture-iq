"use client";
import ProjectGuard from "@/components/ProjectGuard";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useProjectStore } from "@/store/useProjectStore";
import { motion, AnimatePresence } from "framer-motion";

const departments = [
  {
    name: "Research Dept",
    role: "Ingestion & Extraction",
    color: "#818cf8",
    agents: [
      { name: "Opportunity Understanding", key: "opportunity" },
      { name: "Research Planner", key: "planner" },
      { name: "Evidence Researcher", key: "research" },
      { name: "Fact Extractor", key: "extractor" }
    ]
  },
  {
    name: "Intelligence Dept",
    role: "Validation & Sizing",
    color: "#34d399",
    agents: [
      { name: "Validation Agent", key: "validator" },
      { name: "Knowledge Retriever", key: "retriever" },
      { name: "Market Intelligence", key: "market" },
      { name: "Competitor Intelligence", key: "competitor" },
      { name: "SWOT Intelligence", key: "swot" }
    ]
  },
  {
    name: "Synthesis Dept",
    role: "Modeling & Milestones",
    color: "#fbbf24",
    agents: [
      { name: "Risk Intelligence", key: "risk" },
      { name: "Financial Intelligence", key: "financial" },
      { name: "Venture Analyst", key: "analyst" },
      { name: "Founder Roadmap", key: "roadmap" }
    ]
  },
  {
    name: "Decision & Delivery",
    role: "Verdict & Exports",
    color: "#f472b6",
    agents: [
      { name: "Decision Engine", key: "decision" },
      { name: "Report Generation", key: "report" }
    ]
  }
];

const allAgentsList = departments.flatMap(d => d.agents);

const handoffMessages = [
  { key: "opportunity", msg: "Opportunity Understanding classified venture intent and parsed project brief.", from: "Intake", to: "Planner" },
  { key: "planner", msg: "Research Planner created targeted research strategy with 5 market queries.", from: "Planner", to: "Researcher" },
  { key: "research", msg: "Evidence Researcher completed Tavily search and loaded web sources.", from: "Researcher", to: "Extractor" },
  { key: "extractor", msg: "Fact Extractor structured facts, entities, and relationships from search.", from: "Extractor", to: "Validator" },
  { key: "validator", msg: "Validation Agent resolved data conflicts and verified source credibility.", from: "Validator", to: "Retriever" },
  { key: "retriever", msg: "Knowledge Retriever embedded facts into the project semantic vector store.", from: "Retriever", to: "Market" },
  { key: "market", msg: "Market Intelligence calculated TAM/SAM/SOM and growth trajectories.", from: "Market", to: "Competitors" },
  { key: "competitor", msg: "Competitor Intelligence discovered direct threats and built feature matrix.", from: "Competitors", to: "SWOT" },
  { key: "swot", msg: "SWOT Intelligence generated evidence-backed, traceable SWOT profiles.", from: "SWOT", to: "Risks" },
  { key: "risk", msg: "Risk Intelligence evaluated 8 severity dimensions and mitigations.", from: "Risks", to: "Financials" },
  { key: "financial", msg: "Financial Intelligence constructed revenue forecast and runway model.", from: "Financials", to: "Analyst" },
  { key: "analyst", msg: "Venture Analyst scored investment readiness and checked red flags.", from: "Analyst", to: "Roadmap" },
  { key: "roadmap", msg: "Founder Roadmap drafted hiring milestones and GTM strategies.", from: "Roadmap", to: "Decision" },
  { key: "decision", msg: "Decision Engine compiled finalOpportunity Score and verdict.", from: "Decision", to: "Report" },
  { key: "report", msg: "Report Generation finalized 12 pitch slides and compiled PDF reports.", from: "Report", to: "Deliverables" }
];

export default function CollaborationPage() {
  const { projects, activeId } = useProjectStore();
  const activeProject = projects.find((p) => p.id === activeId);

  const isAnalyzing = activeProject?.isAnalyzing ?? false;
  const agentsDone = activeProject?.agentsDone ?? 0;
  const progress = activeProject?.progress ?? 0;

  // Build dynamic swimlanes based on pipeline execution status
  const dynamicSwimlanes = departments.map((d) => {
    const steps = d.agents.map((a) => {
      const globalIdx = allAgentsList.findIndex((x) => x.key === a.key);
      let status: "done" | "running" | "pending" = "pending";
      if (globalIdx < agentsDone) {
        status = "done";
      } else if (globalIdx === agentsDone && isAnalyzing) {
        status = "running";
      }
      return {
        label: a.name,
        status,
        time: status === "done" ? "Completed ✓" : status === "running" ? "Running ●" : "Waiting"
      };
    });

    return {
      agent: d.name,
      role: d.role,
      color: d.color,
      steps
    };
  });

  // Compile active handoff logs dynamically
  const activeLogs = handoffMessages
    .filter((_, idx) => idx < agentsDone)
    .map((log, idx) => ({
      from: log.from,
      to: log.to,
      msg: log.msg,
      ts: `Step ${idx + 1}`,
      color: departments.find(d => d.agents.some(a => a.key === log.key))?.color || "#818cf8"
    }))
    .reverse(); // Newest first

  // Determine current active department index in topology
  let activeDeptIdx = 0;
  if (agentsDone < 4) activeDeptIdx = 0;
  else if (agentsDone < 9) activeDeptIdx = 1;
  else if (agentsDone < 13) activeDeptIdx = 2;
  else activeDeptIdx = 3;

  return (
    <ProjectGuard>
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Collaboration</h1>
          <p className="text-sm text-gray-400 mt-1">Watch agents hand off work in real time across swimlanes.</p>
        </div>

        {/* Header banner */}
        <div className="rounded-xl p-4 flex items-center justify-between"
          style={{ background: "linear-gradient(135deg,rgba(218,242,100,0.08),rgba(218,242,100,0.02))", border: "1px solid rgba(218,242,100,0.15)" }}>
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${isAnalyzing ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
            <span className="text-sm font-semibold text-white">
              {isAnalyzing ? "Multi-agent pipeline running..." : "Multi-agent system idle"}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span>Venture: <span className="text-white font-medium">{activeProject?.name || "EV Charging"}</span></span>
            <span>Progress: <span className="text-[var(--accent)] font-bold">{progress}%</span></span>
            <span style={{ color: isAnalyzing ? "#fbbf24" : "#34d399" }}>
              ● {isAnalyzing ? "Analyzing" : "Complete"}
            </span>
          </div>
        </div>

        {/* Swimlanes */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {dynamicSwimlanes.map((lane, li) => {
            const isDeptActive = li === activeDeptIdx && isAnalyzing;
            return (
              <div key={lane.agent} className="rounded-xl overflow-hidden transition-all duration-300"
                style={{ 
                  border: `1px solid ${isDeptActive ? "var(--accent)" : lane.color + "30"}`,
                  boxShadow: isDeptActive ? "0 0 15px rgba(218,242,100,0.08)" : "none"
                }}>
                {/* Lane header */}
                <div className="px-4 py-3 flex items-center gap-2"
                  style={{ background: `${lane.color}10`, borderBottom: `1px solid ${lane.color}18` }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                    style={{ background: `${lane.color}15`, color: lane.color }}>
                    {lane.agent[0]}
                  </div>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: lane.color }}>{lane.agent}</p>
                    <p className="text-[10px] text-gray-500">{lane.role}</p>
                  </div>
                </div>

                {/* Steps */}
                <div className="p-3 space-y-2" style={{ background: "var(--card-bg)" }}>
                  {lane.steps.map((step, si) => (
                    <motion.div key={si}
                      className="rounded-lg px-3 py-2 border"
                      style={{
                        background: step.status === "done" ? `${lane.color}05` : step.status === "running" ? "rgba(218,242,100,0.05)" : "var(--background)",
                        borderColor: step.status === "done" ? `${lane.color}18` : step.status === "running" ? "var(--accent)" : "var(--card-border)",
                        opacity: step.status === "pending" ? 0.35 : 1
                      }}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs" style={{
                          color: step.status === "done" ? "#34d399" : step.status === "running" ? "var(--accent)" : "#555"
                        }}>
                          {step.status === "done" ? "✓" : step.status === "running" ? "●" : "○"}
                        </span>
                        <span className="text-[10px] font-semibold text-white">
                          {step.label}
                        </span>
                      </div>
                      <p className="text-[9px] text-gray-500 mt-0.5 ml-4">{step.time}</p>
                      {step.status === "running" && (
                        <div className="mt-1.5 ml-4 w-full h-0.5 rounded-full overflow-hidden bg-black/40">
                          <motion.div className="h-full rounded-full" style={{ background: "var(--accent)" }}
                            animate={{ width: ["0%", "90%", "45%"] }} transition={{ duration: 1.5, repeat: Infinity }} />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="rounded-xl p-4 bg-[var(--card-bg)] border border-[var(--card-border)]">
          <div className="flex justify-between text-xs mb-2">
            <span className="font-semibold text-white">Validation Pipeline progress</span>
            <span style={{ color: "var(--accent)" }}>{progress}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-black/40 overflow-hidden">
            <motion.div className="h-full rounded-full"
              style={{ background: "var(--accent)" }}
              animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
          </div>
        </div>

        {/* Bottom panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Agent log */}
          <div className="rounded-xl p-5 bg-[var(--card-bg)] border border-[var(--card-border)] flex flex-col h-72">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Agent handoff logs</h3>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              <AnimatePresence>
                {activeLogs.map((m, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    className="flex gap-2.5 p-2.5 rounded-lg border bg-black/20 border-white/5">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                      style={{ background: `${m.color}15`, color: m.color }}>
                      {m.from[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[10px] font-semibold" style={{ color: m.color }}>{m.from}</span>
                        <span className="text-[9px] text-gray-600">→</span>
                        <span className="text-[10px] text-gray-400 font-semibold">{m.to}</span>
                        <span className="text-[9px] text-gray-600 ml-auto">{m.ts}</span>
                      </div>
                      <p className="text-[10px] text-gray-400 leading-normal">{m.msg}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {activeLogs.length === 0 && (
                <div className="text-center py-16 text-xs text-gray-600">
                  Pipeline inactive. Start an analysis run to observe handoffs.
                </div>
              )}
            </div>
          </div>

          {/* Topology map */}
          <div className="rounded-xl p-5 bg-[var(--card-bg)] border border-[var(--card-border)] flex flex-col justify-between h-72">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Agent network topology</h3>
              <p className="text-[10px] text-gray-500">Live communication paths between departments</p>
            </div>

            <div className="flex items-center justify-around relative py-8">
              {/* Dynamic SVG links */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ top: 0, left: 0 }}>
                {departments.slice(0, 3).map((_, i) => {
                  const isActiveLink = i === activeDeptIdx && isAnalyzing;
                  return (
                    <motion.line key={i}
                      x1={`${12.5 + i * 25}%`} y1="50%" x2={`${25 + i * 25}%`} y2="50%"
                      stroke={isActiveLink ? "var(--accent)" : "rgba(255,255,255,0.06)"}
                      strokeWidth={isActiveLink ? "2" : "1.2"}
                      strokeDasharray={isActiveLink ? "4 3" : "none"}
                      animate={isActiveLink ? { strokeDashoffset: [0, -20] } : {}}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    />
                  );
                })}
              </svg>

              {departments.map((dept, idx) => {
                const isActive = idx === activeDeptIdx && isAnalyzing;
                const hasRun = idx < activeDeptIdx;
                const color = isActive ? "var(--accent)" : hasRun ? dept.color : "#444";
                return (
                  <div key={dept.name} className="flex flex-col items-center gap-1.5 z-10">
                    <motion.div
                      animate={isActive ? { boxShadow: ["0 0 0px var(--accent)", "0 0 16px rgba(218,242,100,0.35)", "0 0 0px var(--accent)"] } : {}}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-base font-bold transition-all duration-300"
                      style={{ 
                        background: isActive ? "rgba(218,242,100,0.12)" : "rgba(255,255,255,0.02)", 
                        color, 
                        border: `1px solid ${isActive ? "var(--accent)" : "rgba(255,255,255,0.08)"}` 
                      }}>
                      {dept.name[0]}
                    </motion.div>
                    <span className="text-[10px] font-semibold transition-colors duration-300" style={{ color }}>
                      {dept.name.split(" ")[0]}
                    </span>
                    <span className="text-[9px] text-gray-600">{dept.name.split(" ")[1] || ""}</span>
                  </div>
                );
              })}
            </div>
            <div className="text-[9px] text-gray-600 text-center">
              Active node: <span className="font-mono text-white">{activeProject?.activeAgentNode || "None (Idle)"}</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
    </ProjectGuard>
  );
}
