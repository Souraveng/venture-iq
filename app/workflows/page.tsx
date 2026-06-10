"use client";
import ProjectGuard from "@/components/ProjectGuard";
import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import AgentBadge from "@/components/AgentBadge";
import { motion, AnimatePresence } from "framer-motion";

const workflows = [
  {
    id: "w1",
    name: "Lead-to-Demo Pipeline",
    desc: "Inbound lead → qualify → personalize outreach → book demo.",
    agents: ["Atlas", "Helios", "Echo"],
    steps: [
      { agent: "Atlas", label: "Research", action: "Gather prospect intel", status: "done" },
      { agent: "Vega", label: "Plan", action: "Generate outreach strategy", status: "done" },
      { agent: "Orion", label: "Execute", action: "Send personalised email", status: "running" },
      { agent: null, label: "Human approval", action: "Review before booking", status: "pending" },
    ],
    status: "active", runs: 142, avgTime: "4m 12s", success: 96, color: "#6366f1",
  },
  {
    id: "w2",
    name: "Bug Triage Auto-Router",
    desc: "Classifies GitHub issues, assigns to right team.",
    agents: ["Orion", "Lyra"],
    steps: [
      { agent: "Lyra", label: "Classify", action: "Tag issue severity & type", status: "done" },
      { agent: "Orion", label: "Route", action: "Assign to team channel", status: "running" },
    ],
    status: "active", runs: 874, avgTime: "28s", success: 99, color: "#10b981",
  },
  {
    id: "w3",
    name: "Weekly Competitive Brief",
    desc: "Atlas researches competitors; Echo drafts brief; Lyra reviews.",
    agents: ["Atlas", "Echo", "Lyra"],
    steps: [
      { agent: "Atlas", label: "Research", action: "Scrape competitor sites & news", status: "done" },
      { agent: "Echo", label: "Draft", action: "Write structured brief", status: "done" },
      { agent: "Lyra", label: "Review", action: "Fact-check and refine", status: "pending" },
    ],
    status: "scheduled", runs: 48, avgTime: "5m 58s", success: 100, color: "#8b5cf6",
  },
  {
    id: "w4",
    name: "Customer Churn Predictor",
    desc: "Scores accounts weekly; Helios reaches out to at-risk.",
    agents: ["Vega", "Helios"],
    steps: [
      { agent: "Vega", label: "Score", action: "Analyse usage patterns", status: "done" },
      { agent: "Helios", label: "Outreach", action: "Email at-risk accounts", status: "running" },
    ],
    status: "active", runs: 52, avgTime: "3m 45s", success: 94, color: "#f59e0b",
  },
];

const statusStyle: Record<string, { bg: string; text: string }> = {
  active:    { bg: "rgba(16,185,129,0.1)", text: "#34d399" },
  scheduled: { bg: "rgba(99,102,241,0.1)", text: "#818cf8" },
  paused:    { bg: "rgba(245,158,11,0.1)", text: "#fbbf24" },
};

const stepStatus: Record<string, { bg: string; text: string; icon: string }> = {
  done:    { bg: "rgba(16,185,129,0.1)", text: "#34d399", icon: "✓" },
  running: { bg: "rgba(99,102,241,0.15)", text: "#818cf8", icon: "⟳" },
  pending: { bg: "rgba(255,255,255,0.05)", text: "#4a4a6a", icon: "○" },
};

export default function WorkflowsPage() {
  const [selected, setSelected] = useState(workflows[0]);

  return (
    <ProjectGuard>
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Workflows</h1>
            <p className="text-sm text-gray-400 mt-1">Automated multi-agent pipelines</p>
          </div>
          <button className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
            + New workflow
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* List */}
          <div className="space-y-3">
            {workflows.map((wf) => (
              <motion.div key={wf.id} whileHover={{ x: 2 }}
                onClick={() => setSelected(wf)}
                className="rounded-xl p-4 cursor-pointer transition-all"
                style={{
                  background: selected.id === wf.id ? "rgba(99,102,241,0.1)" : "var(--card-bg)",
                  border: selected.id === wf.id ? "1px solid rgba(99,102,241,0.4)" : "1px solid var(--card-border)"
                }}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm">{wf.name}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: statusStyle[wf.status].bg, color: statusStyle[wf.status].text }}>
                    {wf.status}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mb-3">{wf.desc}</p>
                <div className="flex items-center gap-1 flex-wrap">
                  {wf.agents.map((a) => <AgentBadge key={a} name={a} size="sm" showStatus={false} />)}
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
                  <h2 className="text-xl font-bold">{selected.name}</h2>
                  <p className="text-sm text-gray-400 mt-1">{selected.desc}</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full"
                  style={{ background: statusStyle[selected.status].bg, color: statusStyle[selected.status].text }}>
                  {selected.status}
                </span>
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
                    <p className="text-lg font-bold">{value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* Steps */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Pipeline</h3>
                <div className="space-y-2">
                  {selected.steps.map((step, i) => (
                    <motion.div key={i}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                      className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: "var(--background)", border: "1px solid var(--card-border)" }}>
                      <span className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                        style={{ background: stepStatus[step.status].bg, color: stepStatus[step.status].text }}>
                        {stepStatus[step.status].icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{step.label}</p>
                        <p className="text-xs text-gray-500 truncate">{step.action}</p>
                      </div>
                      {step.agent && <AgentBadge name={step.agent} size="sm" showStatus={false} />}
                      {!step.agent && (
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(245,158,11,0.1)", color: "#fbbf24" }}>
                          Human
                        </span>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Properties */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Properties</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {[
                    { label: "Trigger", value: "Webhook / Schedule" },
                    { label: "Retry policy", value: "3× exponential backoff" },
                    { label: "Timeout", value: "15 minutes" },
                    { label: "Notifications", value: "Slack + email" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between py-1.5 border-b" style={{ borderColor: "var(--card-border)" }}>
                      <span className="text-gray-400">{label}</span>
                      <span className="font-medium">{value}</span>
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
