"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Rocket, TrendingUp, ArrowRight, ChevronLeft, X, ShieldCheck, FileText } from "lucide-react";

export default function LoginRoleSelectionPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [activeModal, setActiveModal] = useState<"privacy" | "terms" | null>(null);

  useEffect(() => {
    // Layout loads instantly
  }, []);

  return (
    <div ref={containerRef} className="w-full min-h-screen bg-[#131313] text-[#e2e2e2] flex flex-col justify-between items-center px-6 py-8 relative overflow-hidden font-sans selection:bg-[#ccf063] selection:text-black">
      {/* Back Button */}
      <Link
        href="/"
        className="absolute top-6 left-6 z-[100] flex items-center justify-center p-2.5 rounded-xl bg-black/40 hover:bg-black/60 text-white/80 hover:text-white border border-white/10 transition-all shadow-xl backdrop-blur-sm cursor-pointer"
        title="Back"
      >
        <ChevronLeft className="w-4.5 h-4.5" />
      </Link>

      {/* Noise background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />

      {/* Top Header */}
      <header className="w-full max-w-7xl flex justify-center items-center h-16 z-50">
        <Link href="/" className="font-serif text-2xl font-bold tracking-tighter text-white hover:opacity-80 transition-opacity">
          VentureIQ
        </Link>
      </header>

      {/* Main Choice Section */}
      <main className="relative flex-1 flex items-center justify-center w-full max-w-4xl">
        <div className="w-full flex flex-col items-center text-center">
          
          {/* Heading */}
          <div className="mb-12 space-y-4">
            <h1 className="animate-fade font-serif text-4xl sm:text-5xl text-white font-extrabold leading-tight">
              How are you joining us today?
            </h1>
            <p className="animate-fade text-sm text-[#c5c9b2] max-w-lg mx-auto leading-relaxed">
              Select the path that matches your mission. We'll tailor your intelligence dashboard to your specific needs.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
            {/* Founder Card */}
            <button
              onClick={() => router.push("/login/founder")}
              className="animate-fade group text-left p-8 bg-[#1f1f1f] border border-[#454937] hover:border-[#ccf063] rounded-2xl flex flex-col items-start gap-6 transition-all duration-300 hover:-translate-y-1 hover:bg-[#2a2a2a] cursor-pointer w-full text-left relative overflow-hidden"
            >
              <div className="w-16 h-16 rounded-xl bg-[#353535] text-[#ccf063] group-hover:bg-[#ccf063] group-hover:text-[#161f00] flex items-center justify-center transition-colors duration-300">
                <Rocket className="w-8 h-8 text-[#ccf063] group-hover:text-[#161f00]" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white group-hover:text-[#ccf063] transition-colors">I am a Founder</h2>
                <p className="text-xs sm:text-sm text-[#c5c9b2] leading-relaxed">
                  Scale your startup with AI-driven market mapping, competitive intelligence, and direct investor matching workflows.
                </p>
              </div>
              <div className="mt-auto pt-4 flex items-center gap-1.5 text-[#ccf063] font-bold text-xs uppercase tracking-wider">
                Start Building <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Investor Card */}
            <button
              onClick={() => router.push("/login/investor")}
              className="animate-fade group text-left p-8 bg-[#1f1f1f] border border-[#454937] hover:border-[#ccf063] rounded-2xl flex flex-col items-start gap-6 transition-all duration-300 hover:-translate-y-1 hover:bg-[#2a2a2a] cursor-pointer w-full text-left relative overflow-hidden"
            >
              <div className="w-16 h-16 rounded-xl bg-[#353535] text-[#ccf063] group-hover:bg-[#ccf063] group-hover:text-[#161f00] flex items-center justify-center transition-colors duration-300">
                <TrendingUp className="w-8 h-8 text-[#ccf063] group-hover:text-[#161f00]" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white group-hover:text-[#ccf063] transition-colors">I am an Investor</h2>
                <p className="text-xs sm:text-sm text-[#c5c9b2] leading-relaxed">
                  Source high-signal deals, manage your portfolio performance, and access exclusive network intelligence in real-time.
                </p>
              </div>
              <div className="mt-auto pt-4 flex items-center gap-1.5 text-[#ccf063] font-bold text-xs uppercase tracking-wider">
                Start Deploying <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>
        </div>
      </main>

      {/* Footer without Contact Support */}
      <footer className="w-full py-6 flex justify-center border-t border-[#454937]/20">
        <div className="flex gap-6 text-xs text-[#c5c9b2]/80 font-semibold">
          <button 
            onClick={() => setActiveModal("privacy")}
            className="hover:text-[#ccf063] transition-colors cursor-pointer"
          >
            Privacy Policy
          </button>
          <button 
            onClick={() => setActiveModal("terms")}
            className="hover:text-[#ccf063] transition-colors cursor-pointer"
          >
            Terms of Service
          </button>
        </div>
      </footer>

      {/* MODAL POPUP FOR PRIVACY POLICY & TERMS OF SERVICE */}
      {activeModal && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1f1f1f] border border-[#454937] rounded-2xl max-w-xl w-full max-h-[80vh] flex flex-col shadow-2xl relative overflow-hidden animate-fade">
            {/* Modal Header */}
            <div className="p-6 border-b border-[#454937]/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {activeModal === "privacy" ? (
                  <ShieldCheck className="w-5 h-5 text-[#ccf063]" />
                ) : (
                  <FileText className="w-5 h-5 text-[#ccf063]" />
                )}
                <h2 className="text-lg font-bold text-white font-serif">
                  {activeModal === "privacy" ? "Privacy Policy" : "Terms of Service"}
                </h2>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs text-[#c5c9b2] leading-relaxed font-sans">
              {activeModal === "privacy" ? (
                <>
                  <p className="font-semibold text-white">Last Updated: August 2026</p>
                  <p>
                    At VentureIQ, we take the confidentiality of founder pitch data, financial models, and investor intelligence seriously. All data transmitted through our multi-agent validation pipeline is encrypted in transit and at rest.
                  </p>
                  <h4 className="font-bold text-white text-sm pt-2">1. Data Collection & Processing</h4>
                  <p>
                    We collect concept submissions, founder profiles, corporate registration data, and investor verification parameters strictly to power autonomous diligence and matchmaking.
                  </p>
                  <h4 className="font-bold text-white text-sm pt-2">2. Confidentiality & Security</h4>
                  <p>
                    Pitch deck information is never sold to third parties. Access to private deal-room assets is restricted to authenticated, verified investor users.
                  </p>
                  <h4 className="font-bold text-white text-sm pt-2">3. LLM Processing Safeguards</h4>
                  <p>
                    Data sent to specialized LLMs (e.g. Gemini 2.5 / 3.6) is processed securely without being retained for public AI model retraining.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-white">Last Updated: August 2026</p>
                  <p>
                    By accessing or using the VentureIQ platform, you agree to comply with and be bound by the following Terms of Service.
                  </p>
                  <h4 className="font-bold text-white text-sm pt-2">1. User Verification & Accounts</h4>
                  <p>
                    Founders and Investors must provide truthful credentials. Fraudulent verification claims or false financial statements will result in immediate account termination.
                  </p>
                  <h4 className="font-bold text-white text-sm pt-2">2. Investment Disclaimer</h4>
                  <p>
                    VentureIQ scores, confidence ratings, and AI agent reports are provided for informational and analytical assistance only. They do not constitute formal financial advice or SEC-regulated securities offerings.
                  </p>
                  <h4 className="font-bold text-white text-sm pt-2">3. Intellectual Property Rights</h4>
                  <p>
                    Founders retain full ownership of their submitted venture concepts and intellectual property. VentureIQ retains ownership of platform algorithms and multi-agent synthesis engines.
                  </p>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#454937]/50 bg-black/20 flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="px-5 py-2 rounded-xl font-bold text-xs bg-[#ccf063] text-black hover:bg-[#b0d449] transition-colors"
              >
                Close & Agree
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
