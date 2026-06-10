"use client";
import ProjectGuard from "@/components/ProjectGuard";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import AgentBadge from "@/components/AgentBadge";
import { motion, AnimatePresence } from "framer-motion";

const swimlanes = [
  {
    agent: "Atlas", role: "Research", color: "#818cf8",
    steps: [
      { label: "Submitted brief", status: "done", time: "09:00:02" },
      { label: "Search · 12 results", status: "done", time: "09:00:18" },
      { label: "Synthesized brief", status: "done", time: "09:01:04" },
    ],
  },
  {
    agent: "Vega", role: "Planning", color: "#34d399",
    steps: [
      { label: "Received brief", status: "done", time: "09:01:05" },
      { label: "Plan generated", status: "done", time: "09:01:42" },
      { label: "Handed to Orion", status: "done", time: "09:01:43" },
    ],
  },
  {
    agent: "Orion", role: "Execution", color: "#fbbf24",
    steps: [
      { label: "Code written", status: "done", time: "09:02:10" },
      { label: "Tests passing", status: "done", time: "09:02:55" },
      { label: "Handed to Lyra", status: "running", time: "09:03:01" },
    ],
  },
  {
    agent: "Lyra", role: "QA", color: "#f472b6",
    steps: [
      { label: "Tests passed", status: "pending", time: "" },
      { label: "Review complete", status: "pending", time: "" },
      { label: "Delivered ✓", status: "pending", time: "" },
    ],
  },
];

const messages = [
  { from: "Atlas", to: "Vega", msg: "Research complete. Passing brief with 12 sources.", ts: "09:01:04", color: "#818cf8" },
  { from: "Vega", to: "Orion", msg: "Plan generated: 4 tasks, estimated 90s runtime.", ts: "09:01:43", color: "#34d399" },
  { from: "Orion", to: "Lyra", msg: "Code written and tests passing locally. Sending for QA.", ts: "09:03:01", color: "#fbbf24" },
];

const connections = [
  { from: "Atlas", to: "Vega" }, { from: "Vega", to: "Orion" }, { from: "Orion", to: "Lyra" },
];

export default function CollaborationPage() {
  const [activeMsg, setActiveMsg] = useState(0);
  const [progress, setProgress] = useState(72);

  useEffect(() => {
    const t = setInterval(() => {
      setActiveMsg((p) => (p + 1) % messages.length);
      setProgress((p) => Math.min(100, p + Math.random() * 2));
    }, 2500);
    return () => clearInterval(t);
  }, []);

  return (
    <ProjectGuard>
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Collaboration</h1>
          <p className="text-sm text-gray-400 mt-1">Watch agents hand off work in real time across swimlanes.</p>
        </div>

        {/* Header banner */}
        <div className="rounded-xl p-4 flex items-center justify-between"
          style={{ background: "linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.08))", border: "1px solid rgba(99,102,241,0.25)" }}>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm font-semibold">Multi-agent orchestration · Live collaboration</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span>Workflow: <span className="text-white font-medium">Lead-to-Demo Pipeline</span></span>
            <span>Run #143</span>
            <span className="text-emerald-400">● Live</span>
          </div>
        </div>

        {/* Swimlanes */}
        <div className="grid grid-cols-4 gap-3">
          {swimlanes.map((lane, li) => (
            <div key={lane.agent} className="rounded-xl overflow-hidden"
              style={{ border: `1px solid ${lane.color}30` }}>
              {/* Lane header */}
              <div className="px-4 py-3 flex items-center gap-2"
                style={{ background: `${lane.color}15`, borderBottom: `1px solid ${lane.color}20` }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold"
                  style={{ background: `${lane.color}25`, color: lane.color }}>
                  {lane.agent[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: lane.color }}>{lane.agent}</p>
                  <p className="text-xs text-gray-500">{lane.role}</p>
                </div>
              </div>

              {/* Steps */}
              <div className="p-3 space-y-2" style={{ background: "var(--card-bg)" }}>
                {lane.steps.map((step, si) => (
                  <motion.div key={si}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: step.status !== "pending" ? 1 : 0.4, x: 0 }}
                    transition={{ delay: li * 0.1 + si * 0.05 }}
                    className="rounded-lg px-3 py-2.5"
                    style={{
                      background: step.status === "done" ? `${lane.color}10` : step.status === "running" ? `${lane.color}18` : "var(--background)",
                      border: `1px solid ${step.status !== "pending" ? lane.color + "30" : "var(--card-border)"}`,
                    }}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm" style={{
                        color: step.status === "done" ? "#10b981" : step.status === "running" ? lane.color : "#4a4a6a"
                      }}>
                        {step.status === "done" ? "✓" : step.status === "running" ? "⟳" : "○"}
                      </span>
                      <span className="text-xs font-medium" style={{ color: step.status === "pending" ? "#4a4a6a" : "var(--foreground)" }}>
                        {step.label}
                      </span>
                    </div>
                    {step.time && <p className="text-xs text-gray-600 mt-1 ml-5">{step.time}</p>}
                    {step.status === "running" && (
                      <div className="mt-2 ml-5 w-full h-0.5 rounded-full overflow-hidden" style={{ background: "var(--card-border)" }}>
                        <motion.div className="h-full rounded-full" style={{ background: lane.color }}
                          animate={{ width: ["0%", "80%", "65%"] }} transition={{ duration: 2, repeat: Infinity }} />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div className="rounded-xl p-4" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium">Pipeline progress</span>
            <span className="text-gray-400">{progress.toFixed(0)}%</span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--background)" }}>
            <motion.div className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg,#6366f1,#8b5cf6,#a78bfa)" }}
              animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} />
          </div>
        </div>

        {/* Bottom: message log + topology */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Message log */}
          <div className="rounded-xl p-5" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
            <h3 className="text-sm font-semibold mb-4">Agent message log</h3>
            <div className="space-y-3">
              <AnimatePresence>
                {messages.map((m, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                    className="flex gap-3 p-3 rounded-xl"
                    style={{
                      background: activeMsg === i ? `${m.color}10` : "var(--background)",
                      border: `1px solid ${activeMsg === i ? m.color + "30" : "var(--card-border)"}`,
                      transition: "all 0.3s"
                    }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: `${m.color}20`, color: m.color }}>
                      {m.from[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold" style={{ color: m.color }}>{m.from}</span>
                        <span className="text-xs text-gray-600">→</span>
                        <span className="text-xs text-gray-400">{m.to}</span>
                        <span className="text-xs text-gray-600 ml-auto">{m.ts}</span>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed">{m.msg}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Network topology */}
          <div className="rounded-xl p-5" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
            <h3 className="text-sm font-semibold mb-1">Agent network topology</h3>
            <p className="text-xs text-gray-500 mb-6">Active connections and message flow</p>

            <div className="flex items-center justify-around relative">
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ top: 0, left: 0 }}>
                {connections.map((c, i) => (
                  <motion.line key={i}
                    x1={`${12.5 + i * 25}%`} y1="50%" x2={`${25 + i * 25}%`} y2="50%"
                    stroke="rgba(99,102,241,0.4)" strokeWidth="1.5" strokeDasharray="4 3"
                    animate={{ strokeDashoffset: [0, -20] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  />
                ))}
              </svg>

              {swimlanes.map((lane) => (
                <div key={lane.agent} className="flex flex-col items-center gap-2 z-10">
                  <motion.div
                    animate={{ boxShadow: [`0 0 0px ${lane.color}`, `0 0 16px ${lane.color}50`, `0 0 0px ${lane.color}`] }}
                    transition={{ duration: 2, repeat: Infinity, delay: swimlanes.indexOf(lane) * 0.4 }}
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold"
                    style={{ background: `${lane.color}20`, color: lane.color, border: `1px solid ${lane.color}40` }}>
                    {lane.agent[0]}
                  </motion.div>
                  <span className="text-xs font-medium" style={{ color: lane.color }}>{lane.agent}</span>
                  <span className="text-xs text-gray-600">{lane.role}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
    </ProjectGuard>
  );
}
