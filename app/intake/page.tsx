"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useProjectStore } from "@/store/useProjectStore";
import DashboardLayout from "@/components/DashboardLayout";

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

export default function IntakePage() {
  const router = useRouter();
  const { projects, activeId, updateProject } = useProjectStore();
  const active = projects.find((p) => p.id === activeId);

  const [idea, setIdea] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [launching, setLaunching] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  // Only redirect after hydration — prevents flash redirect on first render
  useEffect(() => {
    if (!hydrated) return;
    if (!active) {
      router.replace("/");
      return;
    }
    if (active.intakeComplete) {
      router.replace("/dashboard");
    }
  }, [hydrated, active?.id, active?.intakeComplete]);

  function handleSubmit() {
    if (!idea.trim() || submitted) return;
    setSubmitted(true);
    // Update description from what user typed
    updateProject(activeId, { description: idea.trim() });
  }

  async function handleLaunch() {
    setLaunching(true);
    try {
      // 1. Call your new autonomous backend
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'validate', data: { idea: idea } })
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || `Pipeline failed with status: ${response.status}`);
      }

      // 2. Update the Zustand Store with the real data
      updateProject(activeId, {
        status: "active",
        intakeComplete: true,
        progress: 100,
        agentsDone: 5,
        marketIntel: result.marketIntel || {},
        financialIntel: result.financialIntel || {},
        finalReport: result.finalReport || {},
        researchPlan: result.researchPlan || [],
      });
    } catch (error) {
      console.error("Pipeline invocation error:", error);
      updateProject(activeId, {
        status: "active",
        intakeComplete: true,
        progress: 20,
        agentsDone: 2,
      });
    } finally {
      setLaunching(false);
      router.push("/dashboard");
    }
  }

  // Show nothing until hydration confirms which state we're in
  if (!hydrated) return null;

  return (
    <DashboardLayout>
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">

        {/* Background radial glow — same vibe as landing */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 55% 35% at 50% 55%, rgba(218,242,100,0.05) 0%, transparent 70%)" }} />

        <AnimatePresence mode="wait">

          {/* ── STEP 1: Idea input ── */}
          {!submitted && !launching && (
            <motion.div key="input"
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-2xl flex flex-col items-center text-center gap-6">

              {/* Project name badge */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
                style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", color: "#555" }}>
                <span className="w-4 h-4 rounded flex items-center justify-center text-xs font-bold"
                  style={{ background: "var(--accent)", color: "#0a0a0a" }}>
                  {(active?.name ?? "P").slice(0, 1).toUpperCase()}
                </span>
                {active?.name ?? "New Project"}
              </div>

              {/* Hero heading — landing page style */}
              <h1 style={{
                fontFamily: "'Instrument Serif', serif",
                fontSize: "clamp(2.4rem, 6vw, 4rem)",
                lineHeight: 1.1,
                letterSpacing: "-0.01em",
                color: "#f0f0f0",
              }}>
                Where do I start{" "}
                <span style={{ color: "var(--accent)" }}>your empire?</span>
              </h1>

              <p className="text-sm max-w-md leading-relaxed" style={{ color: "#555" }}>
                Tell me your startup idea in plain English. The more detail you share,
                the sharper each agent's analysis will be.
              </p>

              {/* Chat-style input box — mirrors landing page */}
              <div className="w-full rounded-2xl p-3 pl-5 flex items-end gap-3"
                style={{ background: "#161616", border: "1px solid #242424" }}>
                <textarea
                  ref={textareaRef}
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
                  placeholder="e.g. I want to build an EV charging network + fleet management SaaS for Indian logistics companies..."
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

              {/* Suggestion chips */}
              <div className="flex flex-wrap justify-center gap-2">
                {suggestions.map((s) => (
                  <button key={s} onClick={() => setIdea(s)}
                    className="px-3 py-1.5 rounded-full text-xs transition-all hover:border-gray-500 text-left"
                    style={{ background: "#111", border: "1px solid #1e1e1e", color: "#444" }}>
                    {s}
                  </button>
                ))}
              </div>

              {/* Agents preview */}
              <div className="flex items-center gap-2 mt-2">
                {agentSteps.map((a) => (
                  <div key={a.name} title={a.name}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-base"
                    style={{ background: "#111", border: "1px solid #1e1e1e", color: "#333" }}>
                    {a.icon}
                  </div>
                ))}
                <span className="text-xs ml-1" style={{ color: "#333" }}>5 agents ready</span>
              </div>
            </motion.div>
          )}

          {/* ── STEP 2: Agents briefing animation ── */}
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
                  Briefing your agents
                </h2>
                <p className="text-sm mt-2" style={{ color: "#555" }}>
                  Each agent is reading your idea and preparing its analysis plan.
                </p>
              </div>

              {/* Idea recap */}
              <div className="w-full rounded-xl px-4 py-3 text-left"
                style={{ background: "#161616", border: "1px solid #222" }}>
                <p className="text-xs mb-1 font-medium" style={{ color: "#444" }}>Your idea</p>
                <p className="text-sm text-white leading-relaxed">{idea}</p>
              </div>

              {/* Agent readiness list */}
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

              {/* Launch button — appears after all agents are shown */}
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                className="w-full">
                <button onClick={handleLaunch}
                  className="w-full py-4 rounded-2xl text-base font-bold transition-all hover:opacity-90"
                  style={{
                    background: "var(--accent)",
                    color: "#0a0a0a",
                    boxShadow: "0 0 40px rgba(218,242,100,0.2)",
                  }}>
                  Start Full Analysis →
                </button>
                <p className="text-xs mt-2" style={{ color: "#333" }}>
                  All 5 agents will run in parallel and generate your complete startup package
                </p>
              </motion.div>
            </motion.div>
          )}

          {/* ── STEP 3: Launching ── */}
          {launching && (
            <motion.div key="launch"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-6 text-center">
              <div className="flex gap-3">
                {agentSteps.map((a, i) => (
                  <motion.div key={i}
                    animate={{ y: [0, -12, 0], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                    style={{ background: "rgba(218,242,100,0.1)", color: "var(--accent)" }}>
                    {a.icon}
                  </motion.div>
                ))}
              </div>
              <div>
                <p className="text-lg font-bold text-white">Launching analysis pipeline…</p>
                <p className="text-sm mt-1" style={{ color: "#555" }}>
                  Agents are spinning up. Redirecting to dashboard.
                </p>
              </div>
              {/* Progress bar */}
              <div className="w-64 h-1 rounded-full overflow-hidden" style={{ background: "#1a1a1a" }}>
                <motion.div className="h-full rounded-full" style={{ background: "var(--accent)" }}
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1.8, ease: "easeInOut" }} />
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
