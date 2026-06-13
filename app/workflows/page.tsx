"use client";
import ProjectGuard from "@/components/ProjectGuard";
import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useProjectStore } from "@/store/useProjectStore";
import { motion, AnimatePresence } from "framer-motion";

const agentKeys = [
  "opportunity", "planner", "research", "extractor", "validator", "retriever",
  "market", "competitor", "swot", "risk", "financial", "analyst", "roadmap", "decision", "report"
];

const mockWorkflows = [
  {
    id: "w2",
    name: "Bug Triage Auto-Router",
    desc: "Classifies GitHub issues, assigns tags, and routes to appropriate engineer.",
    agents: ["Fact Extractor", "Validation Agent"],
    steps: [
      { agent: "Fact Extractor", label: "Classify", action: "Tag issue severity & type", status: "done" },
      { agent: "Validation Agent", label: "Route", action: "Assign to team channel", status: "running" },
    ],
    status: "active", runs: 874, avgTime: "28s", success: 99, color: "#10b981",
  },
  {
    id: "w3",
    name: "Weekly Competitive Brief",
    desc: "Researches competitors, writes structured SWOT, and drafts executive brief.",
    agents: ["Competitor Intelligence", "SWOT Intelligence", "Report Generation"],
    steps: [
      { agent: "Competitor Intelligence", label: "Research", action: "Scrape competitor sites & news", status: "done" },
      { agent: "SWOT Intelligence", label: "SWOT", action: "Write structured SWOT profile", status: "done" },
      { agent: "Report Generation", label: "Review", action: "Fact-check and refine report", status: "pending" },
    ],
    status: "scheduled", runs: 48, avgTime: "5m 58s", success: 100, color: "#8b5cf6",
  }
];

const statusStyle: Record<string, { bg: string; text: string }> = {
  active:    { bg: "rgba(16,185,129,0.1)", text: "#34d399" },
  scheduled: { bg: "rgba(99,102,241,0.1)", text: "#818cf8" },
  complete:  { bg: "rgba(218,242,100,0.1)", text: "var(--accent)" },
  paused:    { bg: "rgba(245,158,11,0.1)", text: "#fbbf24" },
};

const stepStatus: Record<string, { bg: string; text: string; icon: string }> = {
  done:    { bg: "rgba(16,185,129,0.1)", text: "#34d399", icon: "✓" },
  running: { bg: "rgba(218,242,100,0.15)", text: "var(--accent)", icon: "⟳" },
  pending: { bg: "rgba(255,255,255,0.03)", text: "#444", icon: "○" },
};

export default function WorkflowsPage() {
  const { projects, activeId, updateProject, addNotification, addAuditEntry } = useProjectStore();
  const activeProject = projects.find((p) => p.id === activeId);

  const [loading, setLoading] = useState(false);

  // Define dynamic Venture Validation Pipeline workflow
  const dynamicWf = {
    id: "w1",
    name: "Venture Validation Pipeline",
    desc: "15-agent orchestrator: parses startup idea, performs search, validates facts, runs financials, and generates pitch decks.",
    agents: ["Opportunity Understanding", "Market Intelligence", "Financial Intelligence", "Venture Analyst", "Decision Engine"],
    steps: [
      { agent: "Opportunity Understanding", label: "Opportunity Ingestion", action: "Parse idea and classify intent", status: getStepStatus(0) },
      { agent: "Research Planner",          label: "Research Planning",   action: "Create target research plan", status: getStepStatus(1) },
      { agent: "Evidence Researcher",       label: "Evidence Research",   action: "Execute web search queries", status: getStepStatus(2) },
      { agent: "Fact Extractor",            label: "Fact Extraction",     action: "Identify entities & relationships", status: getStepStatus(3) },
      { agent: "Validation Agent",          label: "Fact Validation",     action: "Verify facts & resolve conflicts", status: getStepStatus(4) },
      { agent: "Knowledge Retriever",       label: "Vector Memory",       action: "Store and index facts in DB", status: getStepStatus(5) },
      { agent: "Market Intelligence",       label: "Market Analysis",     action: "Compute TAM/SAM/SOM sizing", status: getStepStatus(6) },
      { agent: "Competitor Intelligence",   label: "Competitor Mapping",  action: "Analyze competitors & pricing", status: getStepStatus(7) },
      { agent: "SWOT Intelligence",         label: "SWOT Profile",        action: "Build traceable SWOT matrix", status: getStepStatus(8) },
      { agent: "Risk Intelligence",         label: "Risk Assessment",     action: "Evaluate 8 risk categories", status: getStepStatus(9) },
      { agent: "Financial Intelligence",    label: "Financial Projection",action: "Project revenues & cash flows", status: getStepStatus(10) },
      { agent: "Venture Analyst",           label: " VC Audit",            action: "Assess readiness & red flags", status: getStepStatus(11) },
      { agent: "Founder Roadmap",           label: "Milestones Roadmap",  action: "Plan hiring & GTM strategies", status: getStepStatus(12) },
      { agent: "Decision Engine",           label: "Investment Decision", action: "Determine verdict & score", status: getStepStatus(13) },
      { agent: "Report Generation",         label: "Report Delivery",     action: "Generate 12-slide pitch deck", status: getStepStatus(14) }
    ],
    status: activeProject?.isAnalyzing ? "active" : "complete",
    runs: projects.length + 8,
    avgTime: "3m 45s",
    success: 98,
    color: "#daf264"
  };

  const workflows = [dynamicWf, ...mockWorkflows];
  const [selectedId, setSelectedId] = useState("w1");
  const selected = workflows.find(w => w.id === selectedId) || dynamicWf;

  function getStepStatus(idx: number) {
    if (!activeProject) return "pending";
    if (idx < (activeProject.agentsDone ?? 0)) return "done";
    if (idx === (activeProject.agentsDone ?? 0) && activeProject.isAnalyzing) return "running";
    return "pending";
  }

  async function handleExecutePipeline() {
    if (!activeProject || selected.id !== "w1") return;
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
          "x-gemini-api-key": geminiApiKey,
        },
        body: JSON.stringify({
          mode: "full",
          stream: true,
          projectId: activeId,
          data: {
            name: activeProject.name,
            description: activeProject.description,
          },
          geminiApiKey,
        }),
      });

      if (!response.ok) throw new Error("Execution failed");

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
                const nodeIdx = agentKeys.indexOf(nodeKey);
                const nextNode = agentKeys[nodeIdx + 1] || "";

                updateProject(activeId, {
                  ...nodeData,
                  agentsDone: nodeIdx + 1,
                  activeAgentNode: nextNode,
                  progress: Math.round(((nodeIdx + 1) / agentKeys.length) * 100),
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
                  agentsDone: agentKeys.length,
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Workflows</h1>
            <p className="text-sm text-gray-400 mt-1">Automated multi-agent pipelines</p>
          </div>
          <button className="px-4 py-2 rounded-xl text-sm font-semibold text-black"
            style={{ background: "var(--accent)" }}>
            + New workflow
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* List */}
          <div className="space-y-3">
            {workflows.map((wf) => (
              <motion.div key={wf.id} whileHover={{ x: 2 }}
                onClick={() => setSelectedId(wf.id)}
                className="rounded-xl p-4 cursor-pointer transition-all"
                style={{
                  background: selected.id === wf.id ? "rgba(218,242,100,0.07)" : "var(--card-bg)",
                  border: selected.id === wf.id ? "1px solid rgba(218,242,100,0.3)" : "1px solid var(--card-border)"
                }}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm text-white">{wf.name}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase"
                    style={{ background: statusStyle[wf.status].bg, color: statusStyle[wf.status].text }}>
                    {wf.status}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mb-3 leading-normal">{wf.desc}</p>
                <div className="flex items-center gap-1 flex-wrap">
                  {wf.agents.map((a) => (
                    <span key={a} className="text-[9px] px-1.5 py-0.5 rounded bg-black/40 border border-white/5 text-gray-400 font-medium">
                      {a}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Detail */}
          <AnimatePresence mode="wait">
            <motion.div key={selected.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="lg:col-span-2 rounded-xl p-6 space-y-6"
              style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>

              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">{selected.name}</h2>
                  <p className="text-sm text-gray-400 mt-1 leading-normal">{selected.desc}</p>
                </div>
                <div className="flex items-center gap-2">
                  {selected.id === "w1" && (
                    <button 
                      onClick={handleExecutePipeline}
                      disabled={loading || activeProject?.isAnalyzing}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-black disabled:opacity-50"
                      style={{ background: "var(--accent)" }}>
                      {loading ? "Executing..." : "▶ Run Workflow"}
                    </button>
                  )}
                  <span className="text-[10px] px-2.5 py-1 rounded-full font-bold uppercase"
                    style={{ background: statusStyle[selected.status].bg, color: statusStyle[selected.status].text }}>
                    {selected.status}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Total runs", value: selected.runs },
                  { label: "Avg time", value: selected.avgTime },
                  { label: "Success rate", value: `${selected.success}%` },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-lg p-3 text-center"
                    style={{ background: "var(--background)", border: "1px solid var(--card-border)" }}>
                    <p className="text-lg font-bold text-white">{value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* Steps */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Pipeline Actions</h3>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {selected.steps.map((step, i) => (
                    <motion.div key={i}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-3 p-3 rounded-xl border"
                      style={{ 
                        background: "var(--background)", 
                        borderColor: step.status === "running" ? "var(--accent)" : "var(--card-border)",
                        opacity: step.status === "pending" ? 0.4 : 1
                      }}>
                      <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: stepStatus[step.status].bg, color: stepStatus[step.status].text }}>
                        {stepStatus[step.status].icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white">{step.label}</p>
                        <p className="text-[10px] text-gray-500 truncate mt-0.5">{step.action}</p>
                      </div>
                      {step.agent && (
                        <span className="text-[9px] px-2 py-0.5 rounded bg-black/40 border border-white/5 text-gray-400 font-medium flex-shrink-0">
                          {step.agent}
                        </span>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Properties */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Properties</h3>
                <div className="grid grid-cols-2 gap-x-4 text-xs">
                  {[
                    { label: "Trigger", value: selected.id === "w1" ? "Intake Submission / Rerun Request" : "Webhook / Schedule" },
                    { label: "Retry policy", value: "3× exponential backoff" },
                    { label: "Timeout", value: "15 minutes" },
                    { label: "Notifications", value: "Slack + System alerts" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between py-2 border-b" style={{ borderColor: "var(--card-border)" }}>
                      <span className="text-gray-500">{label}</span>
                      <span className="font-semibold text-gray-300">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
    </ProjectGuard>
  );
}
