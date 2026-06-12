"use client";
import ProjectGuard from "@/components/ProjectGuard";
import { useState, useRef, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useProjectStore, ChatMessage } from "@/store/useProjectStore";
import { motion, AnimatePresence } from "framer-motion";

const agentList = [
  { name: "Opportunity Understanding", role: "Opportunity Parsing",  color: "#daf264", greeting: "Welcome! I'm the Opportunity Understanding Agent. Let's analyze and refine your core startup concept, goals, and key assumptions." },
  { name: "Research Planner",          role: "Research Strategy",   color: "#daf264", greeting: "Hello! I'm the Research Planner. I generate targeted search queries to identify market opportunities and data gaps." },
  { name: "Evidence Researcher",       role: "Information Ingestion",color: "#daf264", greeting: "Hi! I'm the Evidence Researcher. I scan the web and extract research data with complete source attributions." },
  { name: "Fact Extractor",            role: "Knowledge Extraction", color: "#daf264", greeting: "Fact Extractor here. I analyze raw evidence text, extract factual claims, and map out entity relationships." },
  { name: "Validation Agent",          role: "Credibility & Conflict",color: "#daf264", greeting: "Hello! I'm the Validation Agent. I cross-reference facts, detect contradictions, and assign reliability scores." },
  { name: "Knowledge Retriever",       role: "Vector Store Memory",  color: "#daf264", greeting: "Knowledge Retriever online. I manage semantic vectors and retrieve relevant context for other specialist agents." },
  { name: "Market Intelligence",       role: "TAM / SAM / SOM Analysis",color: "#daf264", greeting: "Hi, I'm Market Intelligence. Ask me anything about market size, customer segments, growth rates, or geographic opportunities." },
  { name: "Competitor Intelligence",   role: "Competitor Profiling", color: "#daf264", greeting: "Hey there! Competitor Intelligence here. I discover competitors, build feature matrices, and assess positioning threats." },
  { name: "SWOT Intelligence",         role: "traceable SWOT Analysis",color: "#daf264", greeting: "I'm the SWOT Agent. Ask me about your strengths, weaknesses, opportunities, or threats, backed by validated facts." },
  { name: "Risk Intelligence",         role: "8-Dimension Risk Assessment",color: "#daf264", greeting: "Hello. I'm Risk Intelligence. Ask me about market, regulatory, financial, or technical risks and how to mitigate them." },
  { name: "Financial Intelligence",    role: "financial Modeling",  color: "#daf264", greeting: "Greetings! I'm Financial Intelligence. Let's discuss revenue projections, burn rate, unit economics, and capital needs." },
  { name: "Venture Analyst",           role: "Investment Due Diligence",color: "#daf264", greeting: "Venture Analyst online. Ask me about your VC readiness score, identified red flags, and critical milestones." },
  { name: "Founder Roadmap",           role: "Execution Milestones", color: "#daf264", greeting: "Hi! I'm the Founder Roadmap Agent. Let's draft your execution plan, hiring timeline, and Go-To-Market (GTM) strategy." },
  { name: "Decision Engine",           role: "Verdict & Scoring",    color: "#daf264", greeting: "I am the Decision Engine. I synthesize all analysis vectors to compile your final investment verdict and readiness index." },
  { name: "Report Generation",         role: "Deliverables & Slides",color: "#daf264", greeting: "Hello! I'm the Report Generation Agent. Ask me about compiling your 12-slide pitch deck or exporting executive reports." }
];

export default function ConversationsPage() {
  const { projects, activeId, addChatMessage } = useProjectStore();
  const activeProject = projects.find((p) => p.id === activeId);

  const [activeAgentName, setActiveAgentName] = useState(agentList[0].name);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"chat" | "threads">("chat");
  const bottomRef = useRef<HTMLDivElement>(null);

  const activeAgent = agentList.find((a) => a.name === activeAgentName) || agentList[0];

  const chatHistory: ChatMessage[] = activeProject?.chatMap?.[activeAgent.name] ?? [
    { role: "agent", text: activeAgent.greeting, ts: "System Initialized" },
  ];

  // Scroll to bottom on history change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, loading]);

  async function send() {
    if (!input.trim() || !activeProject) return;

    const userText = input.trim();
    const tsStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // 1. Add User message locally
    addChatMessage(activeId, activeAgent.name, {
      role: "user",
      text: userText,
      ts: tsStr
    });
    setInput("");
    setLoading(true);

    try {
      const geminiApiKey = localStorage.getItem("gemini_api_key") || "";

      // 2. Call backend conversational agent API
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-api-key": geminiApiKey,
        },
        body: JSON.stringify({
          agentName: activeAgent.name,
          message: userText,
          history: chatHistory.slice(1), // Exclude the initial greeting from raw context history
          projectContext: activeProject,
        })
      });

      if (!res.ok) {
        throw new Error("Chat failed");
      }

      const result = await res.json();

      // 3. Add Agent reply to store
      addChatMessage(activeId, activeAgent.name, {
        role: "agent",
        text: result.text || "I apologize, but I could not formulate a response at this moment.",
        ts: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      });
    } catch (err) {
      console.error(err);
      addChatMessage(activeId, activeAgent.name, {
        role: "agent",
        text: "System Alert: Connection failed. Please ensure your GEMINI_API_KEY is configured in Settings.",
        ts: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      });
    } finally {
      setLoading(false);
    }
  }

  // Generate threads list based on active chats or default active agents
  const threads = agentList.map((agent) => {
    const history = activeProject?.chatMap?.[agent.name];
    const preview = history && history.length > 0
      ? history[history.length - 1].text
      : agent.greeting;
    const time = history && history.length > 0
      ? history[history.length - 1].ts
      : "Active";

    return {
      agent: agent.name,
      title: `${agent.name} chat`,
      preview,
      time
    };
  });

  return (
    <ProjectGuard>
    <DashboardLayout>
      <div className="flex h-[calc(100vh-64px)] overflow-hidden">
        {/* Left: agent list / threads */}
        <div className="w-64 flex-shrink-0 border-r flex flex-col" style={{ borderColor: "var(--card-border)", background: "var(--sidebar-bg)" }}>
          <div className="p-4 border-b" style={{ borderColor: "var(--card-border)" }}>
            <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: "var(--card-bg)" }}>
              {(["chat", "threads"] as const).map((v) => (
                <button key={v} onClick={() => setView(v)}
                  className="flex-1 py-1.5 rounded-md text-xs font-semibold transition-all capitalize"
                  style={{
                    background: view === v ? "var(--accent)" : "transparent",
                    color: view === v ? "#0a0a0a" : "var(--muted-fg)"
                  }}>
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            {view === "chat"
              ? agentList.map((a) => (
                  <button key={a.name} onClick={() => { setActiveAgentName(a.name); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5"
                    style={{ background: activeAgentName === a.name ? "rgba(218,242,100,0.08)" : "transparent" }}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ background: "rgba(218,242,100,0.1)", color: "var(--accent)" }}>
                      {a.name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{a.name}</p>
                      <p className="text-[10px] text-gray-500 truncate">{a.role}</p>
                    </div>
                  </button>
                ))
              : threads.map((t) => (
                  <button key={t.agent}
                    onClick={() => { setActiveAgentName(t.agent); setView("chat"); }}
                    className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors border-b"
                    style={{ borderColor: "var(--card-border)" }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                      style={{ background: "rgba(218,242,100,0.1)", color: "var(--accent)" }}>
                      {t.agent[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between mb-0.5">
                        <p className="text-xs font-semibold text-white truncate">{t.agent}</p>
                        <span className="text-[10px] text-gray-600 flex-shrink-0 ml-1">{t.time}</span>
                      </div>
                      <p className="text-[10px] text-gray-500 truncate">{t.preview}</p>
                    </div>
                  </button>
                ))
            }
          </div>
        </div>

        {/* Chat panel */}
        <div className="flex-1 flex flex-col bg-[var(--background)]">
          {/* Chat header */}
          <div className="flex items-center gap-3 px-6 py-4 border-b" style={{ borderColor: "var(--card-border)" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold"
              style={{ background: "rgba(218,242,100,0.15)", color: "var(--accent)" }}>
              {activeAgent.name[0]}
            </div>
            <div>
              <p className="font-semibold text-sm text-white">{activeAgent.name}</p>
              <p className="text-xs text-gray-400">{activeAgent.role}</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
              style={{ background: "rgba(16,185,129,0.08)", color: "#34d399" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live partner
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <AnimatePresence initial={false}>
              {chatHistory.map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  {m.role === "agent" && (
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold mr-2 mt-1 flex-shrink-0"
                      style={{ background: "rgba(218,242,100,0.15)", color: "var(--accent)" }}>
                      {activeAgent.name[0]}
                    </div>
                  )}
                  <div className="max-w-md">
                    <div className="rounded-2xl px-4 py-2.5 text-xs leading-relaxed"
                      style={{
                        background: m.role === "user" ? "var(--accent)" : "var(--card-bg)",
                        color: m.role === "user" ? "#0a0a0a" : "var(--foreground)",
                        border: m.role === "agent" ? "1px solid var(--card-border)" : "none",
                        borderTopLeftRadius: m.role === "agent" ? 4 : undefined,
                        borderTopRightRadius: m.role === "user" ? 4 : undefined,
                        fontWeight: m.role === "user" ? 600 : undefined
                      }}>
                      {m.text}
                    </div>
                    <p className="text-[10px] text-gray-600 mt-1 px-1" style={{ textAlign: m.role === "user" ? "right" : "left" }}>
                      {m.ts}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold"
                  style={{ background: "rgba(218,242,100,0.15)", color: "var(--accent)" }}>
                  {activeAgent.name[0]}
                </div>
                <div className="rounded-2xl px-4 py-3 flex gap-1" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
                  {[0, 1, 2].map((i) => (
                    <motion.span key={i} className="w-1.5 h-1.5 rounded-full"
                      style={{ background: "var(--accent)" }}
                      animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Context sidebar strip */}
          <div className="border-t px-6 py-3 flex items-center gap-6 text-[10px]" style={{ borderColor: "var(--card-border)" }}>
            <div><span className="text-gray-500">Memory · </span><span className="text-gray-300">Zustand persisted</span></div>
            <div><span className="text-gray-500">Evidence · </span><span className="text-gray-300">{activeProject?.evidence?.length ?? 0} facts</span></div>
            <div><span className="text-gray-500">Model · </span><span className="text-gray-300">Gemini 2.5 Flash</span></div>
            <div><span className="text-gray-500">Capability · </span><span className="text-gray-300">{activeAgent.role}</span></div>
          </div>

          {/* Input */}
          <div className="px-6 pb-6">
            <div className="flex gap-3 items-end rounded-2xl p-3"
              style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder={`Message ${activeAgent.name}…`}
                rows={1}
                className="flex-1 bg-transparent text-xs resize-none outline-none text-white placeholder-gray-600"
                style={{ maxHeight: 120 }}
              />
              <button onClick={send}
                disabled={!input.trim() || loading}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-black transition-all flex-shrink-0 font-bold"
                style={{
                  background: input.trim() && !loading ? "var(--accent)" : "var(--card-border)",
                  opacity: input.trim() && !loading ? 1 : 0.5
                }}>
                ↑
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
    </ProjectGuard>
  );
}
