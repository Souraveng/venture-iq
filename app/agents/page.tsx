"use client";
import ProjectGuard from "@/components/ProjectGuard";
import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import { useProjectStore, Project } from "@/store/useProjectStore";

const agents = [
  {
    name: "Opportunity Understanding", icon: "◎", color: "#daf264", status: "done",
    model: "gemini-2.0-flash",
    desc: "Parses raw startup ideas into structured venture context: industry, stage, location, budget, and key assumptions.",
    responsibilities: ["Parse raw input", "Classify industry", "Identify stage", "Extract budget", "Map location"],
    outputs: ["Venture Context", "Structured Opportunity"],
    runs: 1, lastRun: "12s",
  },
  {
    name: "Research Planner", icon: "◈", color: "#daf264", status: "done",
    model: "gemini-2.0-flash",
    desc: "Generates targeted research queries based on opportunity context to guide the evidence research agent.",
    responsibilities: ["Query generation", "Research strategy", "Gap identification", "Priority ranking", "Source targeting"],
    outputs: ["Research Plan", "Prioritized Queries"],
    runs: 1, lastRun: "8s",
  },
  {
    name: "Evidence Researcher", icon: "↗", color: "#daf264", status: "done",
    model: "gemini-2.0-flash",
    desc: "Executes planned research queries across web sources, collecting evidence with source attribution and credibility scoring.",
    responsibilities: ["Web search execution", "Source collection", "Evidence extraction", "Credibility scoring", "Source attribution"],
    outputs: ["Evidence Collection", "Source Database"],
    runs: 1, lastRun: "45s",
  },
  {
    name: "Fact Extractor", icon: "◉", color: "#daf264", status: "done",
    model: "gemini-2.0-flash",
    desc: "Extracts factual claims, named entities, and entity relationships from raw evidence for downstream validation.",
    responsibilities: ["Claim extraction", "Entity recognition", "Relationship mapping", "Deduplication", "Categorization"],
    outputs: ["Facts", "Entities", "Relationships"],
    runs: 1, lastRun: "15s",
  },
  {
    name: "Validation Agent", icon: "✓", color: "#daf264", status: "done",
    model: "gemini-2.0-flash",
    desc: "Cross-validates extracted facts, detects contradictions between sources, and assigns reliability scores.",
    responsibilities: ["Fact validation", "Conflict detection", "Source cross-referencing", "Reliability scoring", "Confidence assignment"],
    outputs: ["Validated Facts", "Conflicts", "Reliability Scores"],
    runs: 1, lastRun: "20s",
  },
  {
    name: "Knowledge Retriever", icon: "◫", color: "#daf264", status: "done",
    model: "gemini-2.0-flash",
    desc: "Stores validated evidence in a vector store and retrieves semantically relevant knowledge for downstream agents.",
    responsibilities: ["Vector storage", "Semantic search", "Knowledge retrieval", "Context enrichment", "Memory management"],
    outputs: ["Retrieved Knowledge", "Embedded Context"],
    runs: 1, lastRun: "10s",
  },
  {
    name: "Market Intelligence", icon: "◎", color: "#daf264", status: "done",
    model: "gemini-2.0-flash",
    desc: "Produces comprehensive market analysis: TAM/SAM/SOM, growth trajectories, customer segments, and geographic opportunities.",
    responsibilities: ["Market sizing", "TAM/SAM/SOM", "Growth analysis", "Segment mapping", "Geographic assessment"],
    outputs: ["Market Analysis Report", "Market Size Data", "Growth Charts"],
    runs: 1, lastRun: "30s",
  },
  {
    name: "Competitor Intelligence", icon: "⬡", color: "#daf264", status: "done",
    model: "gemini-2.0-flash",
    desc: "Discovers competitors, builds comparison matrices, analyzes pricing, and maps competitive positioning.",
    responsibilities: ["Competitor discovery", "Feature comparison", "Pricing analysis", "Threat assessment", "Gap identification"],
    outputs: ["Competitor Profiles", "Feature Matrix", "Threat Map"],
    runs: 1, lastRun: "35s",
  },
  {
    name: "SWOT Intelligence", icon: "⊞", color: "#daf264", status: "done",
    model: "gemini-2.0-flash",
    desc: "Generates evidence-backed SWOT analysis. Every item is traceable to validated facts — no generic statements.",
    responsibilities: ["Strength analysis", "Weakness identification", "Opportunity mapping", "Threat assessment", "Evidence linking"],
    outputs: ["SWOT Matrix", "Evidence-Backed Analysis"],
    runs: 1, lastRun: "18s",
  },
  {
    name: "Risk Intelligence", icon: "⚠", color: "#daf264", status: "done",
    model: "gemini-2.0-flash",
    desc: "Identifies, quantifies, and prioritizes risks across 8 dimensions with mitigation strategies and impact scoring.",
    responsibilities: ["Risk identification", "Likelihood scoring", "Impact assessment", "Mitigation planning", "Priority ranking"],
    outputs: ["Risk Matrix", "Mitigation Plan", "Risk Scores"],
    runs: 1, lastRun: "25s",
  },
  {
    name: "Financial Intelligence", icon: "◆", color: "#daf264", status: "done",
    model: "gemini-2.0-flash",
    desc: "Transforms validated intelligence into financial models: revenue projections, unit economics, cash flow, and funding requirements.",
    responsibilities: ["Revenue modeling", "Unit economics", "Cash flow forecasting", "Burn rate analysis", "Funding requirements"],
    outputs: ["Financial Model", "Revenue Projections", "Cash Flow Forecast"],
    runs: 1, lastRun: "28s",
  },
  {
    name: "Venture Analyst", icon: "◈", color: "#daf264", status: "done",
    model: "gemini-2.0-flash",
    desc: "Evaluates investment attractiveness like a VC partner: challenges assumptions, identifies weaknesses, avoids founder bias.",
    responsibilities: ["Investment analysis", "Due diligence", "Red flag detection", "Moat assessment", "Readiness scoring"],
    outputs: ["Investment Recommendation", "Red Flags", "Moat Analysis"],
    runs: 1, lastRun: "22s",
  },
  {
    name: "Founder Roadmap", icon: "⟳", color: "#daf264", status: "done",
    model: "gemini-2.0-flash",
    desc: "Converts intelligence into practical execution plans: milestones, hiring roadmap, GTM strategy, and priority matrix.",
    responsibilities: ["Milestone planning", "Hiring roadmap", "GTM strategy", "Priority matrix", "Execution timeline"],
    outputs: ["Execution Roadmap", "Hiring Plan", "GTM Strategy"],
    runs: 1, lastRun: "20s",
  },
  {
    name: "Decision Engine", icon: "✦", color: "#daf264", status: "done",
    model: "gemini-2.0-flash",
    desc: "The final decision layer: produces opportunity score, investor readiness rating, and go/no-go verdict.",
    responsibilities: ["Opportunity scoring", "Readiness assessment", "Verdict generation", "Confidence scoring", "Final recommendation"],
    outputs: ["Opportunity Score", "Investor Readiness", "Final Verdict"],
    runs: 1, lastRun: "15s",
  },
  {
    name: "Report Generation", icon: "≡", color: "#daf264", status: "done",
    model: "gemini-2.0-flash",
    desc: "Transforms all intelligence into professional deliverables: pitch deck, business plan, executive summary, and export-ready documents.",
    responsibilities: ["Pitch deck generation", "Business plan", "Executive summary", "PDF export", "Template rendering"],
    outputs: ["12-Slide Pitch Deck", "Business Plan", "Due Diligence Report", "Executive Summary"],
    runs: 1, lastRun: "30s",
  },
];

const statusConfig = {
  done:    { color: "#daf264", bg: "rgba(218, 242, 100, 0.1)",  label: "Completed" },
  running: { color: "#daf264", bg: "rgba(218, 242, 100, 0.15)", label: "Running"   },
  waiting: { color: "#555",    bg: "rgba(255,255,255,0.03)",label: "Waiting"   },
};

export default function AgentsPage() {
  const { projects, activeId, updateProject, addNotification, addAuditEntry } = useProjectStore();
  const activeProject = projects.find((p) => p.id === activeId);
  const [selectedName, setSelectedName] = useState(agents[0].name);
  const [loading, setLoading] = useState(false);

  const dynamicAgents = agents.map((agent, i) => {
    let status = "waiting";
    if (activeProject) {
      if (i < (activeProject.agentsDone ?? 0)) {
        status = "done";
      } else if (i === (activeProject.agentsDone ?? 0) && activeProject.isAnalyzing) {
        status = "running";
      }
    }
    return { ...agent, status };
  });

  const selected = dynamicAgents.find((a) => a.name === selectedName) || dynamicAgents[0];

  async function handleRerun() {
    if (!activeProject) return;
    setLoading(true);
    updateProject(activeId, { isAnalyzing: true, progress: 0, agentsDone: 0, activeAgentNode: "opportunity" });
    addAuditEntry(activeId, {
      user: "Founder",
      avatar: "FO",
      action: "executed.pipeline",
      target: activeProject.name,
      severity: "low",
    });

    try {
      const geminiApiKey = localStorage.getItem("gemini_api_key") || "";
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-gemini-api-key": geminiApiKey
        },
        body: JSON.stringify({
          mode: "full",
          stream: true,
          data: {
            name: activeProject.name,
            description: activeProject.description,
          },
          geminiApiKey,
        }),
      });

      if (!response.ok) throw new Error("Rerun failed");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let buffer = "";

      const AGENT_NAMES: Record<string, string> = {
        opportunity: "Opportunity Understanding",
        planner: "Research Planner",
        research: "Evidence Researcher",
        extractor: "Fact Extractor",
        validator: "Validation Agent",
        retriever: "Knowledge Retriever",
        market: "Market Intelligence",
        competitor: "Competitor Intelligence",
        swot: "SWOT Intelligence",
        risk: "Risk Intelligence",
        financial: "Financial Intelligence",
        analyst: "Venture Analyst",
        roadmap: "Founder Roadmap",
        decision: "Decision Engine",
        report: "Report Generation"
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.trim().startsWith("data: ")) {
            const dataStr = line.trim().slice(6);
            if (dataStr === "[DONE]") break;

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.event === "node_complete") {
                const nodeKey = parsed.node;
                const nodeData = parsed.data;
                const nodeIdx = agents.findIndex((a, idx) => {
                  const nodeKeys = [
                    "opportunity", "planner", "research", "extractor", "validator", "retriever",
                    "market", "competitor", "swot", "risk", "financial", "analyst", "roadmap", "decision", "report"
                  ];
                  return nodeKeys[idx] === nodeKey;
                });
                const nextNode = agents[nodeIdx + 1]?.name || "";

                updateProject(activeId, {
                  ...nodeData,
                  agentsDone: nodeIdx + 1,
                  activeAgentNode: nextNode,
                  progress: Math.round(((nodeIdx + 1) / agents.length) * 100),
                });

                const agentName = AGENT_NAMES[nodeKey] || nodeKey;
                addNotification(activeId, {
                  title: `${agentName} Completed`,
                  body: `Agent completed execution in the pipeline.`,
                  severity: "success",
                  agent: agentName,
                });
                addAuditEntry(activeId, {
                  user: "system",
                  avatar: "SY",
                  action: `completed.${nodeKey}`,
                  target: activeProject.name,
                  severity: "info",
                });
              } else if (parsed.event === "complete") {
                updateProject(activeId, {
                  ...parsed.result,
                  agentsDone: agents.length,
                  progress: 100,
                  isAnalyzing: false,
                  activeAgentNode: "",
                });

                addNotification(activeId, {
                  title: `Pipeline Execution Complete`,
                  body: `Full multi-agent pipeline completed successfully.`,
                  severity: "success",
                  agent: "Decision Engine",
                });
                addAuditEntry(activeId, {
                  user: "system",
                  avatar: "SY",
                  action: "completed.pipeline",
                  target: activeProject.name,
                  severity: "info",
                });
              }
            } catch (err) {
              console.error(err);
            }
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      updateProject(activeId, { isAnalyzing: false });
    }
  }

  return (
    <ProjectGuard>
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Agent Network</h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted-fg)" }}>
            15 specialist AI agents collaborating to build your startup package.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Agent list */}
          <div className="space-y-2">
            {dynamicAgents.map((a, i) => {
              const s = statusConfig[a.status as keyof typeof statusConfig];
              return (
                <motion.div key={a.name} whileHover={{ x: 2 }}
                  onClick={() => setSelectedName(a.name)}
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
                  <button 
                    onClick={handleRerun}
                    disabled={loading || activeProject?.isAnalyzing}
                    className="text-xs px-3 py-1.5 rounded-lg font-medium text-white disabled:opacity-50"
                    style={{ background: "var(--accent)", color: "#0a0a0a" }}>
                    {loading ? "Running..." : "⟳ Re-run"}
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
