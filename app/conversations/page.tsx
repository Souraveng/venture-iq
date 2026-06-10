"use client";
import ProjectGuard from "@/components/ProjectGuard";
import { useState, useRef, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";

const agentList = [
  { name: "Atlas",  role: "Research Strategist", color: "#818cf8", greeting: "Hi, I'm Atlas. What would you like to research today?" },
  { name: "Vega",   role: "Planning & Roadmaps",  color: "#34d399", greeting: "Hey! I'm Vega. Give me a goal and I'll break it into a plan." },
  { name: "Orion",  role: "Code Execution",       color: "#fbbf24", greeting: "Orion here. Paste code or describe what you need built." },
  { name: "Lyra",   role: "Quality Assurance",    color: "#f472b6", greeting: "I'm Lyra. I'll review, test, and make sure everything is solid." },
  { name: "Helios", role: "Sales Outreach",       color: "#a78bfa", greeting: "Hi! I'm Helios. Tell me about your prospect and I'll craft the outreach." },
  { name: "Nexus",  role: "Customer Support",     color: "#fb923c", greeting: "Nexus here. Describe the ticket and I'll draft a response." },
  { name: "Echo",   role: "Content Writer",       color: "#2dd4bf", greeting: "Hey, I'm Echo. What would you like me to write today?" },
  { name: "Cipher", role: "Security Analyst",     color: "#ef4444", greeting: "Cipher online. Share the code or describe the threat and I'll analyse it." },
];

const threads = [
  { agent: "Atlas",  title: "Q1 competitor landscape",    preview: "Found 7 direct competitors in the AI ops space...",  time: "2h ago"  },
  { agent: "Orion",  title: "Refactor auth middleware",    preview: "Replaced bcrypt with argon2id and added rate limit...", time: "4h ago" },
  { agent: "Nexus",  title: "Ticket #4821 escalation",    preview: "Customer reports data sync delay; checked logs...",   time: "6h ago"  },
  { agent: "Echo",   title: "Launch announcement draft",  preview: "Here's the third revision focused on outcome-driven...", time: "Yesterday" },
  { agent: "Vega",   title: "OKR planning Q2",            preview: "Mapped objectives to measurable key results...",      time: "Yesterday" },
];

const agentColors: Record<string, string> = Object.fromEntries(agentList.map((a) => [a.name, a.color]));

const fakeResponses: Record<string, string[]> = {
  Atlas: [
    "Scanning the web for relevant data...",
    "Found 14 sources. Synthesising key insights now.",
    "Here's a structured summary with citations. Want me to go deeper on any section?",
  ],
  Vega: [
    "Breaking that down into actionable milestones...",
    "I've mapped 5 key objectives with dependencies. Shall I assign effort estimates?",
  ],
  Orion: [
    "Running that code now...",
    "Tests passing ✓. Here's the refactored version with inline comments.",
  ],
  default: ["Processing your request...", "Done! Here's what I found. Let me know if you need more detail."],
};

type Message = { role: "user" | "agent"; text: string; ts: string };

export default function ConversationsPage() {
  const [activeAgent, setActiveAgent] = useState(agentList[0]);
  const [input, setInput] = useState("");
  const [chatMap, setChatMap] = useState<Record<string, Message[]>>({});
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"chat" | "threads">("threads");
  const bottomRef = useRef<HTMLDivElement>(null);

  const messages: Message[] = chatMap[activeAgent.name] ?? [
    { role: "agent", text: activeAgent.greeting, ts: "now" },
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function send() {
    if (!input.trim()) return;
    const userMsg: Message = { role: "user", text: input, ts: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
    const current = chatMap[activeAgent.name] ?? [{ role: "agent" as const, text: activeAgent.greeting, ts: "now" }];
    setChatMap((p) => ({ ...p, [activeAgent.name]: [...current, userMsg] }));
    setInput("");
    setLoading(true);

    const responses = fakeResponses[activeAgent.name] ?? fakeResponses.default;
    let delay = 800;
    responses.forEach((r) => {
      setTimeout(() => {
        const agentMsg: Message = { role: "agent", text: r, ts: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
        setChatMap((p) => {
          const prev = p[activeAgent.name] ?? [];
          return { ...p, [activeAgent.name]: [...prev, agentMsg] };
        });
        setLoading(false);
      }, delay);
      delay += 1200;
    });
  }

  return (
    <ProjectGuard>
    <DashboardLayout>
      <div className="flex h-screen overflow-hidden">
        {/* Left: agent list */}
        <div className="w-56 flex-shrink-0 border-r flex flex-col" style={{ borderColor: "var(--card-border)", background: "var(--sidebar-bg)" }}>
          <div className="p-4 border-b" style={{ borderColor: "var(--card-border)" }}>
            <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: "var(--card-bg)" }}>
              {(["chat", "threads"] as const).map((v) => (
                <button key={v} onClick={() => setView(v)}
                  className="flex-1 py-1.5 rounded-md text-xs font-medium transition-all capitalize"
                  style={{
                    background: view === v ? "var(--accent)" : "transparent",
                    color: view === v ? "white" : "var(--muted-fg)"
                  }}>
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            {view === "chat"
              ? agentList.map((a) => (
                  <button key={a.name} onClick={() => setActiveAgent(a)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5"
                    style={{ background: activeAgent.name === a.name ? "rgba(99,102,241,0.08)" : "transparent" }}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ background: `${a.color}20`, color: a.color }}>
                      {a.name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{a.name}</p>
                      <p className="text-xs text-gray-500 truncate">{a.role}</p>
                    </div>
                  </button>
                ))
              : threads.map((t) => (
                  <button key={t.title}
                    onClick={() => { setActiveAgent(agentList.find(a => a.name === t.agent) ?? agentList[0]); setView("chat"); }}
                    className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors border-b"
                    style={{ borderColor: "var(--card-border)" }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                      style={{ background: `${agentColors[t.agent] ?? "#818cf8"}20`, color: agentColors[t.agent] ?? "#818cf8" }}>
                      {t.agent[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between mb-0.5">
                        <p className="text-xs font-semibold truncate">{t.title}</p>
                        <span className="text-xs text-gray-600 flex-shrink-0 ml-1">{t.time}</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{t.preview}</p>
                    </div>
                  </button>
                ))
            }
          </div>
        </div>

        {/* Chat panel */}
        <div className="flex-1 flex flex-col">
          {/* Chat header */}
          <div className="flex items-center gap-3 px-6 py-4 border-b" style={{ borderColor: "var(--card-border)" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold"
              style={{ background: `${activeAgent.color}20`, color: activeAgent.color }}>
              {activeAgent.name[0]}
            </div>
            <div>
              <p className="font-semibold text-sm">{activeAgent.name}</p>
              <p className="text-xs text-gray-400">{activeAgent.role}</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5 text-xs px-2 py-1 rounded-full"
              style={{ background: "rgba(16,185,129,0.1)", color: "#34d399" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> online
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <AnimatePresence initial={false}>
              {messages.map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  {m.role === "agent" && (
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold mr-2 mt-1 flex-shrink-0"
                      style={{ background: `${activeAgent.color}20`, color: activeAgent.color }}>
                      {activeAgent.name[0]}
                    </div>
                  )}
                  <div className="max-w-md">
                    <div className="rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
                      style={{
                        background: m.role === "user" ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "var(--card-bg)",
                        color: "var(--foreground)",
                        border: m.role === "agent" ? "1px solid var(--card-border)" : "none",
                        borderTopLeftRadius: m.role === "agent" ? 4 : undefined,
                        borderTopRightRadius: m.role === "user" ? 4 : undefined,
                      }}>
                      {m.text}
                    </div>
                    <p className="text-xs text-gray-600 mt-1 px-1" style={{ textAlign: m.role === "user" ? "right" : "left" }}>
                      {m.ts}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold"
                  style={{ background: `${activeAgent.color}20`, color: activeAgent.color }}>
                  {activeAgent.name[0]}
                </div>
                <div className="rounded-2xl px-4 py-3 flex gap-1" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
                  {[0, 1, 2].map((i) => (
                    <motion.span key={i} className="w-1.5 h-1.5 rounded-full"
                      style={{ background: activeAgent.color }}
                      animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Context sidebar strip */}
          <div className="border-t px-6 py-3 flex items-center gap-6 text-xs" style={{ borderColor: "var(--card-border)" }}>
            <div><span className="text-gray-500">Memory · </span><span className="text-gray-300">Short-term</span></div>
            <div><span className="text-gray-500">Vectors · </span><span className="text-gray-300">412</span></div>
            <div><span className="text-gray-500">Context · </span><span className="text-gray-300">8.4 / 128k</span></div>
            <div><span className="text-gray-500">Tools · </span><span className="text-gray-300">web_search, summarizer</span></div>
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
                className="flex-1 bg-transparent text-sm resize-none outline-none text-white placeholder-gray-600"
                style={{ maxHeight: 120 }}
              />
              <button onClick={send}
                disabled={!input.trim()}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white transition-all flex-shrink-0"
                style={{
                  background: input.trim() ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "var(--card-border)",
                  opacity: input.trim() ? 1 : 0.5
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
