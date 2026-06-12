"use client";
import DashboardLayout from "@/components/DashboardLayout";
import EditProjectPanel from "@/components/EditProjectPanel";
import ProjectGuard from "@/components/ProjectGuard";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from "recharts";
import { useProjectStore } from "@/store/useProjectStore";

const suggestions = [
  "An AI-powered hiring platform for remote teams",
  "A D2C skincare brand for Gen Z",
  "B2B SaaS for restaurant inventory management",
  "An electric two-wheeler subscription service",
];

const agentSteps = [
  { icon: "◎", name: "Market Research Agent",     delay: 0.0 },
  { icon: "⬡", name: "Competitor Analysis Agent", delay: 0.15 },
  { icon: "◆", name: "Finance Agent",             delay: 0.30 },
  { icon: "≡", name: "Legal Agent",               delay: 0.45 },
  { icon: "✦", name: "Pitch Deck Agent",          delay: 0.60 },
];

const AGENT_NAMES_GLOBAL: Record<string, string> = {
  opportunity: "Opportunity Understanding Agent",
  planner: "Research Planner Agent",
  research: "Evidence Researcher Agent",
  extractor: "Fact Extractor Agent",
  validator: "Validation Agent",
  retriever: "Knowledge Retriever Agent",
  market: "Market Intelligence Agent",
  competitor: "Competitor Intelligence Agent",
  swot: "SWOT Intelligence Agent",
  risk: "Risk Intelligence Agent",
  financial: "Financial Intelligence Agent",
  analyst: "Venture Analyst Agent",
  roadmap: "Founder Roadmap Agent",
  decision: "Decision Engine Agent",
  report: "Report Generation Agent"
};

const AGENT_ACTIVITIES_GLOBAL: Record<string, string> = {
  opportunity: "Analyzing startup concept and clarifying goals...",
  planner: "Defining targeted queries for market, competition, and finance...",
  research: "Performing live web search and gathering data...",
  extractor: "Structuring raw facts and extracting key business entities...",
  validator: "Cross-verifying claims, scoring credibility, and checking conflicts...",
  retriever: "Indexing and retrieving context from vector database...",
  market: "Calculating TAM/SAM/SOM and assessing industry attractiveness...",
  competitor: "Mapping competitor strengths, weaknesses, and feature support...",
  swot: "Structuring strengths, weaknesses, opportunities, and threats...",
  risk: "Prioritizing risk dimensions and devising contingency plans...",
  financial: "Building 3-year revenue projections and unit economics...",
  analyst: "Evaluating investor readiness, red flags, and funding milestones...",
  roadmap: "Synthesizing tactical execution timelines and dependencies...",
  decision: "Compiling final investment score and generating verdict...",
  report: "Consolidating all agent outputs and generating pitch deck...",
};

const VENTURE_AGENTS = [
  { name: "Opportunity Understanding", icon: "◎", nodeKey: "opportunity" },
  { name: "Research Planner",          icon: "◈", nodeKey: "planner" },
  { name: "Evidence Researcher",       icon: "↗", nodeKey: "research" },
  { name: "Fact Extractor",            icon: "◉", nodeKey: "extractor" },
  { name: "Validation Agent",          icon: "✓", nodeKey: "validator" },
  { name: "Knowledge Retriever",       icon: "◫", nodeKey: "retriever" },
  { name: "Market Intelligence",       icon: "◎", nodeKey: "market" },
  { name: "Competitor Intelligence",   icon: "⬡", nodeKey: "competitor" },
  { name: "SWOT Intelligence",         icon: "⊞", nodeKey: "swot" },
  { name: "Risk Intelligence",         icon: "⚠", nodeKey: "risk" },
  { name: "Financial Intelligence",    icon: "◆", nodeKey: "financial" },
  { name: "Venture Analyst",           icon: "◈", nodeKey: "analyst" },
  { name: "Founder Roadmap",           icon: "⟳", nodeKey: "roadmap" },
  { name: "Decision Engine",           icon: "✦", nodeKey: "decision" },
  { name: "Report Generation",         icon: "≡", nodeKey: "report" },
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
  const { projects, activeId, updateProject, addNotification, addAuditEntry, addProject } = useProjectStore();
  const activeProject = projects.find((p) => p.id === activeId);
  const [editOpen, setEditOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Onboarding states
  const [idea, setIdea] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [launching, setLaunching] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync state if active project changes (or has an existing description but not completed intake)
  useEffect(() => {
    if (activeProject && !activeProject.intakeComplete) {
      if (activeProject.description) {
        setIdea(activeProject.description);
        setSubmitted(true);
        if (activeProject.isAnalyzing) {
          setLaunching(true);
        } else {
          setLaunching(false);
        }
      } else {
        setIdea("");
        setSubmitted(false);
        setLaunching(false);
      }
    } else {
      setIdea("");
      setSubmitted(false);
      setLaunching(false);
    }
  }, [activeProject?.id, activeProject?.intakeComplete, activeProject?.isAnalyzing]);

  async function handleLaunch() {
    if (!activeProject) return;
    setLaunching(true);
    updateProject(activeProject.id, { isAnalyzing: true, progress: 0, agentsDone: 0, activeAgentNode: "opportunity" });

    const VENTURE_AGENTS_PIPELINE = [
      { nodeKey: "opportunity" }, { nodeKey: "planner" }, { nodeKey: "research" },
      { nodeKey: "extractor" }, { nodeKey: "validator" }, { nodeKey: "retriever" },
      { nodeKey: "market" }, { nodeKey: "competitor" }, { nodeKey: "swot" },
      { nodeKey: "risk" }, { nodeKey: "financial" }, { nodeKey: "analyst" },
      { nodeKey: "roadmap" }, { nodeKey: "decision" }, { nodeKey: "report" }
    ];

    addAuditEntry(activeProject.id, {
      user: "Founder",
      avatar: "FO",
      action: "executed.pipeline",
      target: activeProject.name,
      severity: "low",
    });

    try {
      let result: any = null;
      const geminiApiKey = localStorage.getItem("gemini_api_key") || "";
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-gemini-api-key': geminiApiKey,
        },
        body: JSON.stringify({ 
          mode: 'validate', 
          stream: true,
          data: { idea: idea },
          geminiApiKey,
        })
      });

      if (!response.ok) {
        throw new Error(`Pipeline failed with status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const decoder = new TextDecoder();
      let buffer = "";

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
                const nodeIdx = VENTURE_AGENTS_PIPELINE.findIndex((a) => a.nodeKey === nodeKey);
                const nextNode = VENTURE_AGENTS_PIPELINE[nodeIdx + 1]?.nodeKey || "";

                updateProject(activeProject.id, {
                  ...nodeData,
                  agentsDone: nodeIdx + 1,
                  activeAgentNode: nextNode,
                  progress: Math.round(((nodeIdx + 1) / VENTURE_AGENTS_PIPELINE.length) * 100),
                });

                const agentName = AGENT_NAMES_GLOBAL[nodeKey] || nodeKey;
                addNotification(activeProject.id, {
                  title: `${agentName} Completed`,
                  body: `Agent completed execution in the pipeline.`,
                  severity: "success",
                  agent: agentName,
                });
                addAuditEntry(activeProject.id, {
                  user: "system",
                  avatar: "SY",
                  action: `completed.${nodeKey}`,
                  target: activeProject.name,
                  severity: "info",
                });
              } else if (parsed.event === "complete") {
                result = parsed.result;
                updateProject(activeProject.id, {
                  ...result,
                  status: "active",
                  intakeComplete: true,
                  agentsDone: VENTURE_AGENTS_PIPELINE.length,
                  progress: 100,
                  isAnalyzing: false,
                  activeAgentNode: "",
                });

                addNotification(activeProject.id, {
                  title: `Pipeline Execution Complete`,
                  body: `Full multi-agent pipeline completed successfully.`,
                  severity: "success",
                  agent: "Decision Engine",
                });
                addAuditEntry(activeProject.id, {
                  user: "system",
                  avatar: "SY",
                  action: "completed.pipeline",
                  target: activeProject.name,
                  severity: "info",
                });
              } else if (parsed.event === "error") {
                throw new Error(parsed.error || "Graph stream execution failed");
              }
            } catch (e) {
              console.error("Error parsing stream event:", e);
            }
          }
        }
      }

      if (!result) {
        throw new Error("Pipeline completed but returned no state update");
      }

      updateProject(activeProject.id, {
        status: "active",
        intakeComplete: true,
        progress: 100,
        agentsDone: VENTURE_AGENTS_PIPELINE.length,
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
      });
    } catch (error) {
      console.error("Pipeline invocation error:", error);
      updateProject(activeProject.id, {
        status: "active",
        intakeComplete: true,
        progress: 20,
        agentsDone: 2,
        isAnalyzing: false,
      });
    } finally {
      setLaunching(false);
    }
  }

  function handleSubmit() {
    if (!idea.trim() || submitted) return;
    setSubmitted(true);
    if (!activeProject) {
      const words = idea.trim().split(/\s+/);
      const derivedName = words.slice(0, 4).join(" ") + (words.length > 4 ? "..." : "");
      addProject(derivedName, idea.trim());
    } else {
      updateProject(activeProject.id, { description: idea.trim() });
    }
  }

  // ── ONBOARDING / INTAKE RENDER ──
  if (!activeProject || !activeProject.intakeComplete) {
    return (
      <ProjectGuard>
        <DashboardLayout>
          <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse 55% 35% at 50% 55%, rgba(218,242,100,0.05) 0%, transparent 70%)" }} />

            <AnimatePresence mode="wait">
              {/* Step 1: Idea input */}
              {!submitted && !launching && (
                <motion.div key="input"
                  initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.5 }}
                  className="w-full max-w-2xl flex flex-col items-center text-center gap-6">

                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
                    style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", color: "#555" }}>
                    <span className="w-4 h-4 rounded flex items-center justify-center text-xs font-bold"
                      style={{ background: "var(--accent)", color: "#0a0a0a" }}>
                      {(activeProject?.name ?? "V").slice(0, 1).toUpperCase()}
                    </span>
                    {activeProject?.name ?? "New Venture Idea"}
                  </div>

                  <h1 style={{
                    fontFamily: "'Instrument Serif', serif",
                    fontSize: "clamp(2.4rem, 6vw, 4rem)",
                    lineHeight: 1.1,
                    letterSpacing: "-0.01em",
                    color: "#f0f0f0",
                  }}>
                    Where do I start{" "}
                    <span style={{ color: "var(--accent)" }}>your venture validation?</span>
                  </h1>

                  <p className="text-sm max-w-md leading-relaxed" style={{ color: "#555" }}>
                    Tell me your startup or business concept in detail. The more info you provide, the deeper our agent analysis will be.
                  </p>

                  <div className="w-full rounded-2xl p-3 pl-5 flex items-end gap-3"
                    style={{ background: "#161616", border: "1px solid #242424" }}>
                    <textarea
                      ref={textareaRef}
                      value={idea}
                      onChange={(e) => setIdea(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
                      placeholder="e.g. I want to build a marketplace for electric vehicles in South-East Asia..."
                      rows={3}
                      className="flex-1 bg-transparent text-sm resize-none outline-none text-white placeholder-gray-600 leading-relaxed"
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={handleSubmit}
                      disabled={!idea.trim()}
                      className="flex-shrink-0 px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
                      style={{
                        background: idea.trim() ? "var(--accent)" : "#1e1e1e",
                        color: idea.trim() ? "#0a0a0a" : "#333",
                      }}>
                      Analyse →
                    </motion.button>
                  </div>

                  <div className="flex flex-wrap justify-center gap-2">
                    {suggestions.map((s) => (
                      <button key={s} onClick={() => setIdea(s)}
                        className="px-3 py-1.5 rounded-full text-xs transition-all hover:border-gray-500 text-left"
                        style={{ background: "#111", border: "1px solid #1e1e1e", color: "#444" }}>
                        {s}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    {agentSteps.map((a) => (
                      <div key={a.name} title={a.name}
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-base"
                        style={{ background: "#111", border: "1px solid #1e1e1e", color: "#333" }}>
                        {a.icon}
                      </div>
                    ))}
                    <span className="text-xs ml-1" style={{ color: "#333" }}>15 specialized agents ready</span>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Briefing */}
              {submitted && !launching && (
                <motion.div key="brief"
                  initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.5 }}
                  className="w-full max-w-xl flex flex-col items-center text-center gap-8">

                  <div>
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center text-2xl"
                      style={{ background: "rgba(218,242,100,0.1)", border: "1px solid rgba(218,242,100,0.2)" }}>
                      🚀
                    </motion.div>
                    <h2 style={{
                      fontFamily: "'Instrument Serif', serif",
                      fontSize: "2rem",
                      color: "#f0f0f0",
                      lineHeight: 1.2,
                    }}>
                      Briefing your validation agents
                    </h2>
                    <p className="text-sm mt-2" style={{ color: "#555" }}>
                      Each agent is reviewing your concept and planning their analysis criteria.
                    </p>
                  </div>

                  <div className="w-full rounded-xl px-4 py-3 text-left"
                    style={{ background: "#161616", border: "1px solid #222" }}>
                    <p className="text-xs mb-1 font-medium" style={{ color: "#444" }}>Your Venture Idea</p>
                    <p className="text-sm text-white leading-relaxed">{idea}</p>
                  </div>

                  <div className="w-full space-y-2">
                    {agentSteps.map((a, i) => (
                      <motion.div key={a.name}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: a.delay + 0.3, duration: 0.35 }}
                        className="flex items-center gap-3 rounded-xl px-4 py-3"
                        style={{ background: "#111", border: "1px solid #1e1e1e" }}>
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base"
                          style={{ background: "rgba(218,242,100,0.08)", color: "var(--accent)" }}>
                          {a.icon}
                        </div>
                        <span className="flex-1 text-sm text-white">{a.name}</span>
                        <motion.div
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          transition={{ delay: a.delay + 0.7 }}
                          className="flex items-center gap-1.5 text-xs font-medium"
                          style={{ color: "var(--accent)" }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent)" }} />
                          Ready
                        </motion.div>
                      </motion.div>
                    ))}
                  </div>

                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }} className="w-full">
                    <button onClick={handleLaunch}
                      className="w-full py-4 rounded-2xl text-base font-bold transition-all hover:opacity-90"
                      style={{
                        background: "var(--accent)",
                        color: "#0a0a0a",
                        boxShadow: "0 0 40px rgba(218,242,100,0.2)",
                      }}>
                      Start Venture Analysis →
                    </button>
                    <p className="text-xs mt-2" style={{ color: "#333" }}>
                      15 validation agents will execute in sequence to generate your analysis report.
                    </p>
                  </motion.div>
                </motion.div>
              )}

              {/* Step 3: Launching (pipeline progress) */}
              {launching && (
                <motion.div key="launch"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-6 text-center max-w-md w-full">
                  <div className="flex gap-3">
                    {agentSteps.map((a, i) => {
                      const stepIndex = Math.min(4, Math.floor((activeProject?.agentsDone || 0) / 3));
                      const isActive = stepIndex === i;
                      return (
                        <motion.div key={i}
                          animate={isActive ? { y: [0, -12, 0], opacity: [0.5, 1, 0.5] } : {}}
                          transition={{ duration: 0.8, repeat: Infinity }}
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                          style={{ 
                            background: isActive ? "rgba(218,242,100,0.15)" : "rgba(255,255,255,0.03)", 
                            color: isActive ? "var(--accent)" : "#444",
                            border: isActive ? "1px solid var(--accent)" : "1px solid #222"
                          }}>
                          {a.icon}
                        </motion.div>
                      );
                    })}
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-bold text-white">
                      {activeProject?.activeAgentNode 
                        ? (AGENT_NAMES_GLOBAL[activeProject.activeAgentNode] || "VentureIQ Agent")
                        : "Initializing analysis pipeline..."}
                    </p>
                    <p className="text-xs transition-colors duration-300" style={{ color: "var(--accent)" }}>
                      {activeProject?.activeAgentNode 
                        ? (AGENT_ACTIVITIES_GLOBAL[activeProject.activeAgentNode] || "Analyzing startup data...")
                        : "Warming up agent environments..."}
                    </p>
                    <p className="text-[10px]" style={{ color: "#555" }}>
                      Completed {activeProject?.agentsDone || 0} of 15 validation steps
                    </p>
                  </div>
                  <div className="w-64 h-1.5 rounded-full overflow-hidden" style={{ background: "#1a1a1a" }}>
                    <div className="h-full rounded-full transition-all duration-500" 
                      style={{ 
                        background: "var(--accent)",
                        width: `${activeProject?.progress || 0}%` 
                      }} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </DashboardLayout>
      </ProjectGuard>
    );
  }

  // ── ACTIVE PROJECT VARIABLES ──
  const projectName = activeProject.name;
  const projectDesc = activeProject.description;
  const decReport = activeProject.decisionReport || null;
  const readiness = decReport?.ventureReadiness?.score ?? (activeProject.finalReport?.readinessScore ?? 74);
  const opportunity = decReport?.opportunityScore?.score ?? 85;
  const risk = activeProject.riskIntel?.overallRiskIndex?.score ?? 32;
  const confidence = decReport?.confidence?.score ?? 82;
  
  const decision = decReport?.verdict?.decision || "PROCEED";
  const reasoning = decReport?.verdict?.reasoning || [];
  const stage = decReport?.ventureReadiness?.stage || "N/A";
  const executiveSummary = decReport?.executiveSummary || "";
  const topOpportunities = decReport?.topOpportunities || [];
  const topRisks = decReport?.topRisks || [];
  const recommendedActions = decReport?.recommendedActions || [];

  const scores = [
    { label: "Venture Readiness", value: readiness, color: "#daf264" },
    { label: "Opportunity Score", value: opportunity, color: "#daf264" },
    { label: "Overall Risk Index", value: risk, color: risk > 50 ? "#ef4444" : "#daf264" },
    { label: "Data Confidence",    value: confidence, color: "#daf264" },
  ];

  async function handleRerun() {
    setLoading(true);
    updateProject(activeId, { isAnalyzing: true, progress: 0, agentsDone: 0, activeAgentNode: "opportunity" });
    addAuditEntry(activeId, {
      user: "Founder",
      avatar: "FO",
      action: "executed.pipeline",
      target: projectName,
      severity: "low",
    });

    try {
      const geminiApiKey = localStorage.getItem("gemini_api_key") || "";
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-gemini-api-key": geminiApiKey,
        },
        body: JSON.stringify({
          mode: "full",
          stream: true,
          data: {
            name: projectName,
            description: projectDesc,
          },
          geminiApiKey,
        }),
      });

      if (!response.ok) {
        throw new Error("Rerun failed");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Failed to get response reader");
      }

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
                const nodeIdx = VENTURE_AGENTS.findIndex((a) => a.nodeKey === nodeKey);
                const nextNode = VENTURE_AGENTS[nodeIdx + 1]?.nodeKey || "";

                updateProject(activeId, {
                  ...nodeData,
                  agentsDone: nodeIdx + 1,
                  activeAgentNode: nextNode,
                  progress: Math.round(((nodeIdx + 1) / VENTURE_AGENTS.length) * 100),
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
                  target: projectName,
                  severity: "info",
                });
              } else if (parsed.event === "complete") {
                updateProject(activeId, {
                  ...parsed.result,
                  agentsDone: VENTURE_AGENTS.length,
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
                  target: projectName,
                  severity: "info",
                });
              } else if (parsed.event === "error") {
                console.error("Streaming error:", parsed.error);
              }
            } catch (err) {
              console.error("Error parsing stream chunk:", err, dataStr);
            }
          }
        }
      }
    } catch (e) {
      console.error("Failed to rerun:", e);
    } finally {
      setLoading(false);
      updateProject(activeId, { isAnalyzing: false });
    }
  }

  return (
    <ProjectGuard>
    <DashboardLayout>
      <div className="p-8 space-y-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-sm" style={{ color: "var(--muted-fg)" }}>Good morning, Founder.</p>
          <h1 className="text-2xl font-bold mt-0.5 text-white">Venture Intelligence Overview</h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted-fg)" }}>
            Analyzing: <span className="font-semibold" style={{ color: "var(--accent)" }}>{activeProject.name}</span>
            &nbsp;·&nbsp; {loading ? "Re-running pipeline..." : `${activeProject.agentsDone} of ${activeProject.totalAgents} agents completed`}
          </p>
        </motion.div>

        {/* Venture Context strip */}
        {activeProject?.ventureContext && Object.keys(activeProject.ventureContext).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {activeProject.ventureContext.industry && (
              <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: "rgba(218,242,100,0.08)", color: "var(--accent)", border: "1px solid rgba(218,242,100,0.15)" }}>
                {activeProject.ventureContext.industry}
              </span>
            )}
            {activeProject.ventureContext.stage && (
              <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: "rgba(130,140,248,0.08)", color: "#818cf8", border: "1px solid rgba(130,140,248,0.15)" }}>
                Stage: {activeProject.ventureContext.stage}
              </span>
            )}
            {activeProject.ventureContext.location && (
              <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: "rgba(52,211,153,0.08)", color: "#34d399", border: "1px solid rgba(52,211,153,0.15)" }}>
                📍 {activeProject.ventureContext.location}
              </span>
            )}
            {activeProject.ventureContext.budget && (
              <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: "rgba(251,191,36,0.08)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.15)" }}>
                💰 {activeProject.ventureContext.budget}
              </span>
            )}
          </div>
        )}

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
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--muted-fg)" }}>Venture Validation Scores</h2>
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
                  decision.includes("STRONG") || decision === "PROCEED"
                    ? "rgba(34, 197, 94, 0.04)"
                    : decision.includes("CAUTION")
                    ? "rgba(234, 179, 8, 0.04)"
                    : "rgba(239, 68, 68, 0.04)",
                borderColor:
                  decision.includes("STRONG") || decision === "PROCEED"
                    ? "rgba(34, 197, 94, 0.2)"
                    : decision.includes("CAUTION")
                    ? "rgba(234, 179, 8, 0.2)"
                    : "rgba(239, 68, 68, 0.2)"
              }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest"
                  style={{
                    color:
                      decision.includes("STRONG") || decision === "PROCEED"
                        ? "#22c55e"
                        : decision.includes("CAUTION")
                        ? "#eab308"
                        : "#ef4444"
                  }}>
                  INVESTMENT VERDICT
                </span>
                <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-black/40 border border-white/5">
                  STAGE: {stage}
                </span>
              </div>
              <h2 className="text-2xl font-black text-white">
                {decision}
              </h2>
              <ul className="space-y-2 mt-3 pl-1">
                {reasoning.map((r: string, i: number) => (
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
                {executiveSummary}
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
                  {topOpportunities.map((o: string, i: number) => (
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
                  {topRisks.map((r: string, i: number) => (
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
                {recommendedActions.map((action: string, i: number) => (
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

        {/* Agent pipeline — Real 15 VentureIQ agents */}
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--card-border)" }}>
          <div className="px-5 py-4 flex items-center justify-between"
            style={{ background: "var(--card-bg)", borderBottom: "1px solid var(--card-border)" }}>
            <h2 className="text-sm font-semibold">VentureIQ Agent Pipeline</h2>
            <span className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{ background: "rgba(218, 242, 100, 0.1)", color: "var(--accent)" }}>
              {activeProject?.agentsDone === activeProject?.totalAgents ? "✓ Complete" : "● Live"}
            </span>
          </div>
          <div style={{ background: "var(--background)" }}>
            {VENTURE_AGENTS.map((agent, i) => {
              const isDone = i < (activeProject?.agentsDone ?? 0);
              const isRunning = i === (activeProject?.agentsDone ?? 0) && loading;
              const status = isDone ? "done" : isRunning ? "running" : "waiting";
              const s = statusStyle[status as keyof typeof statusStyle];
              return (
                <motion.div key={agent.name}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-4 px-5 py-3 border-b last:border-0"
                  style={{ borderColor: "var(--card-border)" }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                    style={{ background: isDone ? "rgba(218, 242, 100, 0.15)" : "var(--card-bg)", color: isDone ? "var(--accent)" : "#444", border: "1px solid var(--card-border)" }}>
                    {isDone ? "✓" : i + 1}
                  </div>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                    style={{ background: s.bg, color: s.color }}>
                    {agent.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white">{agent.name}</p>
                    {isRunning && (
                      <p className="text-[10px] mt-0.5 animate-pulse" style={{ color: "var(--accent)" }}>
                        {AGENT_ACTIVITIES_GLOBAL[agent.nodeKey] || "Executing..."}
                      </p>
                    )}
                    {isDone && (
                      <p className="text-[10px] mt-0.5" style={{ color: "var(--muted-fg)" }}>
                        Completed successfully
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                    style={{ background: s.bg, color: s.color }}>
                    {isRunning && <span className="mr-1 inline-block w-1 h-1 rounded-full bg-current animate-pulse" />}
                    {s.label}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Quick outputs — wired to graph data */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            {
              title: "Market Size (TAM)",
              value: activeProject?.marketIntel?.marketSize?.tam
                ? activeProject.marketIntel.marketSize.tam
                : activeProject?.marketIntel?.tam || "$2.4T",
              sub: activeProject?.marketIntel?.marketSize?.description || "Total addressable market",
              icon: "◎"
            },
            {
              title: "Top Competitor",
              value: activeProject?.competitorIntel?.competitorProfiles?.[0]?.name || "Not analyzed",
              sub: activeProject?.competitorIntel?.competitorProfiles?.[0]?.type
                ? `${activeProject.competitorIntel.competitorProfiles[0].type} · ${activeProject.competitorIntel.competitorProfiles[0].geography || "Global"}`
                : "Run analysis to discover",
              icon: "⬡"
            },
            {
              title: "Funding Required",
              value: activeProject?.financialIntel?.fundingRequirements?.capitalNeeded
                ? (activeProject.financialIntel.fundingRequirements.capitalNeeded >= 1000000
                    ? `$${(activeProject.financialIntel.fundingRequirements.capitalNeeded / 1000000).toFixed(1)}M`
                    : `$${Math.round(activeProject.financialIntel.fundingRequirements.capitalNeeded / 1000)}K`)
                : "$4.2M",
              sub: activeProject?.financialIntel?.fundingRequirements?.fundingTimeline || "Seed round estimate",
              icon: "◆"
            },
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
