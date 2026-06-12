"use client";
import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

  // Auth modal states
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function handleStart() {
    if (!idea.trim()) return;
    const words = idea.trim().split(/\s+/);
    const derivedName = words.slice(0, 4).join(" ") + (words.length > 4 ? "..." : "");
    addProject(derivedName, idea.trim());
    router.push("/intake");
  }

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // Simple validations
    if (!email.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }
    if (authMode === "signup" && !fullName.trim()) {
      setErrorMsg("Please enter your full name.");
      return;
    }

    setIsLoading(true);
    // Mock network lag
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);

    // Mock Login - Redirect to dashboard
    router.push("/dashboard");
    setShowAuthModal(false);
  };

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
          <button 
            onClick={() => { setAuthMode("signin"); setShowAuthModal(true); setErrorMsg(""); }}
            className="hover:text-white transition-colors bg-transparent border-none cursor-pointer outline-none font-medium text-sm">
            Sign In
          </button>
        </div>

        <button 
          onClick={() => { setAuthMode("signup"); setShowAuthModal(true); setErrorMsg(""); }}
          className="bg-transparent border-none outline-none cursor-pointer">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold"
            style={{ background: "white", color: "#0a0a0a" }}>
            Get started
          </motion.div>
        </button>
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
          <button 
            onClick={() => { setAuthMode("signup"); setShowAuthModal(true); setErrorMsg(""); }}
            className="bg-transparent border-none outline-none cursor-pointer">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="btn-accent px-8 py-3 text-sm font-bold rounded-full"
              style={{ background: "#daf264", color: "#0a0a0a" }}>
              Launch StartupOS →
            </motion.div>
          </button>
        </div>
      </section>

      <footer className="border-t px-8 py-5 text-center text-xs" style={{ borderColor: "#1a1a1a", color: "#444" }}>
        © 2026 StartupOS · AI-Powered Startup Builder Platform
      </footer>

      {/* Premium Sliding Auth Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAuthModal(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-[12px]"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative w-full max-w-[420px] rounded-[24px] overflow-hidden p-8 z-10"
              style={{
                background: "rgba(18, 18, 18, 0.75)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
                backdropFilter: "blur(20px)",
              }}
            >
              {/* Radial glow background effect inside modal */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full pointer-events-none filter blur-[64px]"
                style={{ background: "rgba(218, 242, 100, 0.08)" }} />

              {/* Close Button */}
              <button
                onClick={() => setShowAuthModal(false)}
                className="absolute top-5 right-5 text-gray-500 hover:text-white transition-colors text-xl font-bold bg-transparent border-none cursor-pointer outline-none"
              >
                &times;
              </button>

              {/* Logo */}
              <div className="flex items-center gap-2 mb-6">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs"
                  style={{ background: "#daf264", color: "#0a0a0a" }}>S</div>
                <span className="font-bold text-xs tracking-wide text-white">StartupOS</span>
              </div>

              {/* Switch tabs */}
              <div className="flex bg-[#111] p-1 rounded-xl mb-6 border border-white/5 relative">
                <button
                  type="button"
                  onClick={() => { setAuthMode("signin"); setErrorMsg(""); }}
                  className="flex-1 text-center py-2 text-xs font-semibold rounded-lg z-10 transition-colors relative cursor-pointer"
                  style={{ color: authMode === "signin" ? "#0a0a0a" : "#888" }}
                >
                  {authMode === "signin" && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 rounded-lg"
                      style={{ background: "#daf264" }}
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-20">Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode("signup"); setErrorMsg(""); }}
                  className="flex-1 text-center py-2 text-xs font-semibold rounded-lg z-10 transition-colors relative cursor-pointer"
                  style={{ color: authMode === "signup" ? "#0a0a0a" : "#888" }}
                >
                  {authMode === "signup" && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 rounded-lg"
                      style={{ background: "#daf264" }}
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-20">Create Account</span>
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {authMode === "signup" && (
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-[#161616] border border-white/5 rounded-xl px-4 py-3 text-xs outline-none transition-all text-white placeholder-gray-600 focus:border-[#daf264]/50 focus:ring-1 focus:ring-[#daf264]/30"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="jane@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#161616] border border-white/5 rounded-xl px-4 py-3 text-xs outline-none transition-all text-white placeholder-gray-600 focus:border-[#daf264]/50 focus:ring-1 focus:ring-[#daf264]/30"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#161616] border border-white/5 rounded-xl px-4 py-3 text-xs outline-none transition-all text-white placeholder-gray-600 focus:border-[#daf264]/50 focus:ring-1 focus:ring-[#daf264]/30"
                  />
                </div>

                {errorMsg && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-400 text-xs font-semibold"
                  >
                    {errorMsg}
                  </motion.p>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full relative flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all mt-6 cursor-pointer"
                  style={{
                    background: "white",
                    color: "#0a0a0a",
                    opacity: isLoading ? 0.7 : 1,
                  }}
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-[#0a0a0a] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>{authMode === "signin" ? "Sign In" : "Get Started"} &rarr;</span>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
