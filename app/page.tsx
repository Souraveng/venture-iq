"use client";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useProjectStore } from "@/store/useProjectStore";

const examples = [
  "I want to launch an EV startup in India.",
  "Build a SaaS tool for freelance designers.",
  "Create a D2C health supplement brand.",
  "Start a B2B logistics platform for SMEs.",
];

export default function LandingPage() {
  const [idea, setIdea] = useState("");
  const router = useRouter();
  const { addProject } = useProjectStore();

  function handleStart() {
    if (!idea.trim()) return;
    const words = idea.trim().split(/\s+/);
    const derivedName = words.slice(0, 4).join(" ") + (words.length > 4 ? "..." : "");
    addProject(derivedName, idea.trim());
    router.push("/intake");
  }

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0a", color: "#f0f0f0" }}>

      {/* Nav — matches screenshot */}
      <nav className="fixed top-0 w-full z-50 px-8 py-4 flex items-center justify-between"
        style={{ background: "rgba(10,10,10,0.85)", backdropFilter: "blur(16px)", borderBottom: "1px solid #1a1a1a" }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm"
            style={{ background: "#daf264", color: "#0a0a0a" }}>S</div>
          <span className="font-bold text-sm tracking-wide text-white">StartupOS</span>
        </div>
        <div className="flex items-center gap-7 text-sm" style={{ color: "#888" }}>
          <a href="#" className="hover:text-white transition-colors">Pricing</a>
          <a href="#" className="hover:text-white transition-colors">Documentation</a>
          <a href="#" className="hover:text-white transition-colors">Case studies</a>
        </div>
        <Link href="/dashboard">
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold"
            style={{ background: "white", color: "#0a0a0a" }}>
            → Get started
          </motion.button>
        </Link>
      </nav>

      {/* Hero */}
      <section className="pt-36 pb-24 px-8 text-center relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 40% at 50% 60%, rgba(218, 242, 100, 0.04) 0%, transparent 70%)" }} />

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium mb-8"
            style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", color: "#888" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#daf264" }} />
            Multi-agent orchestration · Now in private beta
          </div>

          {/* Headline — Instrument Serif, 4.5rem */}
          <h1 className="font-display leading-tight mb-6"
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: "4.5rem",
              letterSpacing: "-0.01em",
              lineHeight: 1.05,
            }}>
            <span style={{ color: "#f0f0f0" }}>Compose </span>
            <span style={{ color: "#daf264" }}>agent networks</span>
            <br />
            <span style={{ color: "#f0f0f0" }}>that ship work for you.</span>
          </h1>

          <p className="text-lg max-w-xl mx-auto mb-10 leading-relaxed" style={{ color: "#666" }}>
            StartupOS is the operating system for autonomous teams of AI agents —
            research, plan, build, review. Configure once. Orchestrate forever.
          </p>

          {/* Input box — matches screenshot dark pill */}
          <div className="max-w-2xl mx-auto flex items-center gap-3 p-2 pl-5 rounded-2xl"
            style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}>
            <input
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleStart()}
              placeholder="Describe the agent network you want to build..."
              className="flex-1 bg-transparent text-sm outline-none placeholder-gray-600 text-white"
            />
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={handleStart}
              className="btn-accent px-5 py-2.5 text-sm font-semibold rounded-xl flex items-center gap-2"
              style={{ background: "#daf264", color: "#0a0a0a", borderRadius: 12 }}>
              Get started →
            </motion.button>
          </div>

          {/* Example prompts */}
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            {examples.map((ex) => (
              <button key={ex} onClick={() => { setIdea(ex); }}
                className="px-3.5 py-1.5 rounded-full text-xs transition-all hover:border-gray-500"
                style={{ background: "#111", border: "1px solid #222", color: "#555" }}>
                {ex}
              </button>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Agent Network Preview */}
      <section className="px-8 pb-20 max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-2">5 AI agents. One complete startup.</h2>
          <p style={{ color: "#555" }} className="text-sm">Each agent is a specialist. Together they build your investor-ready business.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {[
            { name: "Market Research", icon: "◎", color: "#daf264", desc: "TAM/SAM/SOM, trends, customer segments" },
            { name: "Competitor Analysis", icon: "⬡", color: "#daf264", desc: "SWOT, competitor matrix, positioning" },
            { name: "Finance Agent", icon: "◆", color: "#daf264", desc: "Revenue projections, burn rate, funding" },
            { name: "Legal Agent", icon: "≡", color: "#daf264", desc: "Compliance, structure, risk assessment" },
            { name: "Pitch Deck", icon: "✦", color: "#daf264", desc: "Investor-ready deck, executive summary" },
          ].map((agent, i) => (
            <motion.div key={agent.name}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}
              whileHover={{ y: -4 }}
              className="rounded-2xl p-4 text-center relative"
              style={{ background: "#111", border: "1px solid #1e1e1e" }}>
              {i < 4 && (
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-xs"
                  style={{ color: "#333" }}>→</div>
              )}
              <div className="w-10 h-10 rounded-xl mx-auto flex items-center justify-center text-xl mb-3"
                style={{ background: "rgba(218, 242, 100, 0.1)", color: "#daf264" }}>
                {agent.icon}
              </div>
              <p className="text-xs font-semibold text-white mb-1">{agent.name}</p>
              <p className="text-xs" style={{ color: "#555" }}>{agent.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-8 pb-24 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: "Real-time agent collaboration", desc: "Watch agents hand off work in live swimlane views. Approve, intervene, re-run any step.", icon: "⟳" },
            { title: "Investor-ready outputs", desc: "Auto-generate pitch decks, financial models, SWOT analyses, and business model canvases.", icon: "✦" },
            { title: "Startup Readiness Score", desc: "Visual scoring across market, competition, finance, legal, and execution dimensions.", icon: "◉" },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl p-5"
              style={{ background: "#111", border: "1px solid #1e1e1e" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg mb-4"
                style={{ background: "rgba(218, 242, 100, 0.1)", color: "#daf264" }}>
                {f.icon}
              </div>
              <h3 className="font-semibold text-sm text-white mb-2">{f.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: "#555" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-8 pb-24 text-center">
        <div className="max-w-xl mx-auto rounded-3xl p-10"
          style={{ background: "#111", border: "1px solid #222" }}>
          <h2 className="text-3xl font-bold mb-3">Ready to build your startup?</h2>
          <p className="text-sm mb-6" style={{ color: "#555" }}>Enter your idea. Our agent network does the rest.</p>
          <Link href="/dashboard">
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="btn-accent px-8 py-3 text-sm font-bold rounded-full"
              style={{ background: "#daf264", color: "#0a0a0a" }}>
              Launch StartupOS →
            </motion.button>
          </Link>
        </div>
      </section>

      <footer className="border-t px-8 py-5 text-center text-xs" style={{ borderColor: "#1a1a1a", color: "#444" }}>
        © 2026 StartupOS · AI-Powered Startup Builder Platform
      </footer>
    </div>
  );
}
