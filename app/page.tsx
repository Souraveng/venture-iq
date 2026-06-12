"use client";
import { useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import DotsBackground from "@/components/DotsBackground";

function LandingPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  // Auth modal states
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
        name: authMode === "signup" ? fullName : email.split("@")[0],
        action: authMode,
      });

      if (result?.error) {
        if (result.error.includes("USER_EXISTS")) {
          setErrorMsg("An account with this email already exists. Please sign in instead.");
        } else if (result.error.includes("USER_NOT_FOUND")) {
          setErrorMsg("No account found with this email. Please sign up first.");
        } else {
          setErrorMsg("Failed to authenticate. Please check your credentials.");
        }
        setIsLoading(false);
        return;
      }

      router.push(callbackUrl);
      setShowAuthModal(false);
    } catch (err: any) {
      setErrorMsg(err.message || "An authentication error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "#0a0a0a", color: "#f0f0f0" }}>
      {/* Interactive Floating Dots Background */}
      <DotsBackground />

      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 px-8 py-4 flex items-center justify-between"
        style={{ background: "rgba(10,10,10,0.85)", backdropFilter: "blur(16px)", borderBottom: "1px solid #1a1a1a" }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm"
            style={{ background: "#daf264", color: "#0a0a0a" }}>V</div>
          <span className="font-bold text-sm tracking-wide text-white">VentureIQ</span>
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
      <section className="pt-36 pb-24 px-8 text-center relative z-10">
        {/* Subtle background glow */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 40% at 50% 60%, rgba(218, 242, 100, 0.03) 0%, transparent 70%)" }} />

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium mb-8"
            style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", color: "#888" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#daf264" }} />
            Multi-agent venture validation · Private Beta
          </div>

          {/* Headline — Instrument Serif */}
          <h1 className="font-display leading-tight mb-6"
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: "4.5rem",
              letterSpacing: "-0.01em",
              lineHeight: 1.05,
            }}>
            <span style={{ color: "#f0f0f0" }}>Validate </span>
            <span style={{ color: "#daf264" }}>venture concepts</span>
            <br />
            <span style={{ color: "#f0f0f0" }}>with multi-agent intelligence.</span>
          </h1>

          <p className="text-lg max-w-xl mx-auto mb-10 leading-relaxed" style={{ color: "#666" }}>
            VentureIQ is the operating system for autonomous venture validation.
            Deploy a coordinated network of 15 AI agents to research, analyze, and grade your business ideas instantly.
          </p>

          <button 
            onClick={() => { setAuthMode("signup"); setShowAuthModal(true); setErrorMsg(""); }}
            className="bg-transparent border-none outline-none cursor-pointer">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-8 py-3.5 rounded-full text-base font-semibold"
              style={{ background: "#daf264", color: "#0a0a0a" }}>
              Get started for free &rarr;
            </motion.div>
          </button>
        </motion.div>
      </section>

      {/* Agent Network Preview */}
      <section className="px-8 pb-20 max-w-5xl mx-auto relative z-10">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-2 text-white">15 AI agents. One complete analysis.</h2>
          <p style={{ color: "#555" }} className="text-sm">Each agent specializes in a distinct facet of venture validation to deliver objective, investor-grade analysis.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {[
            { name: "Market Intelligence", icon: "◎", color: "#daf264", desc: "TAM/SAM/SOM, trends, and market attractiveness" },
            { name: "Competitor Analysis", icon: "⬡", color: "#daf264", desc: "SWOT, competitor matrix, and positioning" },
            { name: "Financial Modeler", icon: "◆", color: "#daf264", desc: "3-year projections, unit economics, and burn rate" },
            { name: "Risk Assessment", icon: "⚠", color: "#daf264", desc: "Red flags, operational risks, and mitigations" },
            { name: "Decision Engine", icon: "✦", color: "#daf264", desc: "Venture readiness scoring and investment verdicts" },
          ].map((agent, i) => (
            <motion.div key={agent.name}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}
              whileHover={{ y: -4 }}
              className="rounded-2xl p-4 text-center relative"
              style={{ background: "#111", border: "1px solid #1e1e1e" }}>
              {i < 4 && (
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-xs hidden md:block"
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
      <section className="px-8 pb-24 max-w-5xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: "Real-time agent collaboration", desc: "Watch agents hand off work in live swimlane views. Approve, intervene, re-run any step.", icon: "⟳" },
            { title: "Investor-ready outputs", desc: "Auto-generate reports, financial models, SWOT analyses, and venture canvases.", icon: "✦" },
            { title: "Venture Readiness Score", desc: "Visual scoring across market, competition, finance, risk, and execution dimensions.", icon: "◉" },
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
      <section className="px-8 pb-24 text-center relative z-10">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-3 text-white">Evaluate your next venture.</h2>
          <p className="text-sm mb-6" style={{ color: "#555" }}>Deploy our multi-agent intelligence network to validate your concepts today.</p>
          <button 
            onClick={() => { setAuthMode("signup"); setShowAuthModal(true); setErrorMsg(""); }}
            className="bg-transparent border-none outline-none cursor-pointer">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="px-8 py-3.5 text-sm font-bold rounded-full"
              style={{ background: "#daf264", color: "#0a0a0a" }}>
              Get Started Now &rarr;
            </motion.div>
          </button>
        </div>
      </section>

      <footer className="border-t px-8 py-5 text-center text-xs relative z-10" style={{ borderColor: "#1a1a1a", color: "#444" }}>
        © 2026 VentureIQ · AI-Powered Venture Intelligence Platform
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
                  style={{ background: "#daf264", color: "#0a0a0a" }}>V</div>
                <span className="font-bold text-xs tracking-wide text-white">VentureIQ</span>
              </div>

              {/* Google OAuth Button */}
              <button
                type="button"
                onClick={() => {
                  signIn("google", { callbackUrl: "/dashboard" });
                }}
                className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-xs font-semibold text-white bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer mb-5 shadow-sm"
              >
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path
                    fill="#4285F4"
                    d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.47h4.84c-.21 1.12-.84 2.07-1.79 2.7l2.76 2.13c1.61-1.49 2.54-3.69 2.54-6.46z"
                  />
                  <path
                    fill="#34A853"
                    d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.76-2.13c-.76.51-1.74.82-3.2.82-2.46 0-4.54-1.66-5.29-3.89L.94 13.5C2.42 16.44 5.48 18 9 18z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M3.71 10.62c-.19-.58-.3-1.2-.3-1.84s.11-1.26.3-1.84L.94 4.05C.34 5.24 0 6.58 0 8s.34 2.76.94 3.95l2.77-1.33z"
                  />
                  <path
                    fill="#EA4335"
                    d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.86 11.43 0 9 0 5.48 0 2.42 1.56.94 4.5l2.77 2.13C4.46 5.24 6.54 3.58 9 3.58z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-[1px] bg-white/10" />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">or</span>
                <div className="flex-1 h-[1px] bg-white/10" />
              </div>

              {/* Switch tabs */}
              <div className="flex bg-[#111] p-1 rounded-xl mb-6 border border-white/5 relative">
                <button
                  type="button"
                  onClick={() => { setAuthMode("signin"); setErrorMsg(""); }}
                  className="flex-1 text-center py-2.5 text-xs font-semibold rounded-lg z-10 transition-colors relative cursor-pointer"
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
                  className="flex-1 text-center py-2.5 text-xs font-semibold rounded-lg z-10 transition-colors relative cursor-pointer"
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
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-[#161616] border border-white/5 rounded-xl px-4 py-3.5 text-xs outline-none transition-all text-white placeholder-gray-600 focus:border-[#daf264]/50 focus:ring-1 focus:ring-[#daf264]/30"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="jane@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#161616] border border-white/5 rounded-xl px-4 py-3.5 text-xs outline-none transition-all text-white placeholder-gray-600 focus:border-[#daf264]/50 focus:ring-1 focus:ring-[#daf264]/30"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#161616] border border-white/5 rounded-xl px-4 py-3.5 text-xs outline-none transition-all text-white placeholder-gray-600 focus:border-[#daf264]/50 focus:ring-1 focus:ring-[#daf264]/30"
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
                  className="w-full relative flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-bold transition-all mt-6 cursor-pointer"
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

export default function LandingPage() {
  return (
    <Suspense fallback={null}>
      <LandingPageInner />
    </Suspense>
  );
}
