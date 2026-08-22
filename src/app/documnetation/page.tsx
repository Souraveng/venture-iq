"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  BookOpen, 
  Search, 
  ChevronRight, 
  Cpu, 
  Briefcase, 
  TrendingUp, 
  ShieldAlert, 
  FileText, 
  Bot, 
  Code, 
  Users, 
  Zap, 
  ArrowLeft,
  CheckCircle2,
  Terminal,
  Layers,
  Sparkles,
  Lock,
  Globe
} from "lucide-react";

export default function DocumentationPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");

  const docSections = [
    {
      id: "overview",
      title: "System Overview",
      icon: BookOpen,
      content: (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white font-serif mb-2">
              VentureIQ Architecture & Product Documentation
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
              VentureIQ is an autonomous multi-agent operating system designed for venture concept validation, automated deal-room diligence, founder-investor matchmaking, and investment grading.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-zinc-100 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-[#d4f96a]/20 text-[#6a990a] dark:text-[#d4f96a] flex items-center justify-center font-bold text-sm">7</div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Validation Engines</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">Autonomous AI agents covering research, competitors, risk, finance, pitch, roadmap & validation verdict.</p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-100 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">2</div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white">User Workspaces</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">Specialized dual portals for Founders (Pitching & Validation) and Investors (Feed, Deal Rooms & Diligence).</p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-100 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-sm">API</div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white">LLM Pipeline & SSE</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">Real-time Server-Sent Events (SSE) for multi-agent live stream handoffs and instant text refining.</p>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Platform Core Capabilities</h2>
            <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#86be14] dark:text-[#d4f96a] shrink-0 mt-0.5" />
                <span><strong>Multi-Agent Research Pipeline:</strong> Parallel execution of deep-dive prompts synthesizing TAM/SAM/SOM, SWOT matrices, CAC/LTV projections, and regulatory risk scoring.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#86be14] dark:text-[#d4f96a] shrink-0 mt-0.5" />
                <span><strong>Founder Deal Room & Verification:</strong> Structured verification process for startups, uploaded deck parsing, and direct deal-room invitation links.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#86be14] dark:text-[#d4f96a] shrink-0 mt-0.5" />
                <span><strong>Investor Diligence & Auctions:</strong> Comprehensive investment thesis matching, private deal-room auctions, direct messaging, and meeting scheduling.</span>
              </li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: "agents",
      title: "7 AI Agent Engines",
      icon: Cpu,
      content: (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white font-serif mb-2">
              The 7 Intelligence Dimensions
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm">
              Each validation project executes 7 autonomous agents sequentially and in parallel to generate structured reports.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                name: "1. Market Research Agent",
                id: "research",
                desc: "Analyzes global market trends, target audience demographics, TAM/SAM/SOM estimates, and sector growth CAGR.",
                output: "Global Market Research Matrix, Confidence Score, Demand Tagging"
              },
              {
                name: "2. Competitor Analysis Agent",
                id: "competitors",
                desc: "Maps direct and indirect competitors, constructs 2x2 competitive positioning matrices, and identifies defensible moats.",
                output: "Competitive Moat Assessment, Legacy Player UX Flaw Breakdown"
              },
              {
                name: "3. Risk Assessment Agent",
                id: "risks",
                desc: "Scans for operational red flags, legal/compliance hurdles (GDPR/SOC2), and AI hallucination failure modes.",
                output: "Risk Heatmap, Actionable Mitigation Protocols"
              },
              {
                name: "4. Financial Modeler Agent",
                id: "financials",
                desc: "Computes 3-year revenue projections, burn rate estimates, unit economics (CAC, LTV, payback period), and gross margin targets.",
                output: "Financial Runway Model, ARR Growth Milestones"
              },
              {
                name: "5. Pitch Framing Agent",
                id: "pitch",
                desc: "Extracts high-converting elevator pitch hooks, frames core value propositions, and structures investor slide flows.",
                output: "Investor Pitch Outline & Strategic Framing"
              },
              {
                name: "6. Strategic Execution Roadmap Agent",
                id: "roadmap",
                desc: "Breaks development into 6-month product milestones, integration priorities (ATS, API), and design partner launch targets.",
                output: "Quarterly Execution Roadmap & Integration Targets"
              },
              {
                name: "7. Venture Validation Verdict Agent",
                id: "validation",
                desc: "Synthesizes data across all 6 preceding agents to produce an overall Venture Readiness Grade (A+ to F) and investment verdict.",
                output: "Final Venture Scorecard, Investor Readiness Grade"
              }
            ].map((agent, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-white">{agent.name}</h3>
                  <span className="text-[10px] font-mono bg-[#d4f96a]/20 text-[#6a990a] dark:text-[#d4f96a] px-2 py-0.5 rounded font-semibold">
                    ENGINE / {agent.id.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">{agent.desc}</p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-500 font-mono pt-1">
                  <strong>Output Specs:</strong> {agent.output}
                </p>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: "founder",
      title: "Founder Hub",
      icon: Briefcase,
      content: (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white font-serif mb-2">
              Founder Portal & Workflow Guide
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm">
              Complete walkthrough for founders validating new startup ideas, setting up pitch decks, and engaging with potential investors.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 space-y-2">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#d4f96a] text-black text-xs flex items-center justify-center font-bold">1</span>
                Venture Concept Submission & Live Validation
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Founders input their venture idea in <code className="bg-zinc-200 dark:bg-zinc-800 px-1 py-0.5 rounded">/founder/validation</code>. The platform triggers live SSE streaming handoffs between the 7 agents, allowing founders to approve or refine each analysis step in real-time.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 space-y-2">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#d4f96a] text-black text-xs flex items-center justify-center font-bold">2</span>
                Pitch Setup & AI Text Fixer
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Under <code className="bg-zinc-200 dark:bg-zinc-800 px-1 py-0.5 rounded">/founder/pitch-setup</code>, founders configure pitch summaries and leverage the built-in AI text polisher endpoint (<code className="bg-zinc-200 dark:bg-zinc-800 px-1 py-0.5 rounded">/api/ai/fix-text</code>) to optimize value propositions for investor appeal.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 space-y-2">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#d4f96a] text-black text-xs flex items-center justify-center font-bold">3</span>
                Verification & Investor Connect
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Founders complete corporate verification forms (<code className="bg-zinc-200 dark:bg-zinc-800 px-1 py-0.5 rounded">/founder/verification</code>) to earn verified venture badges, publish pitch preview cards, and accept inbound investor meeting requests.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "investor",
      title: "Investor Hub",
      icon: TrendingUp,
      content: (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white font-serif mb-2">
              Investor Portal & Deal Rooms
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm">
              Discover verified high-grade startups, run deep-dive diligence graphs, and conduct private deal-room auctions.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 space-y-2">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Pitch Feed & Matchmaking Engine</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Investors filter incoming startup pitches by Readiness Grade, Sector (SaaS, FinTech, AI, HealthTech), and Funding Stage (Pre-Seed to Series A) at <code className="bg-zinc-200 dark:bg-zinc-800 px-1 py-0.5 rounded">/investor/pitch-feed</code>.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 space-y-2">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Automated Diligence Graph</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Using LangGraph orchestration via <code className="bg-zinc-200 dark:bg-zinc-800 px-1 py-0.5 rounded">/api/diligence</code>, investors can request deep-dive audits on cap tables, IP ownership, financial stress tests, and technical architecture.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 space-y-2">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Auction Rooms & Direct Messaging</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Participate in syndicate term sheet auctions (<code className="bg-zinc-200 dark:bg-zinc-800 px-1 py-0.5 rounded">/investor/auction</code>) and engage in encrypted direct deal conversations (<code className="bg-zinc-200 dark:bg-zinc-800 px-1 py-0.5 rounded">/investor/pitch-room</code>).
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "api",
      title: "API Reference",
      icon: Terminal,
      content: (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white font-serif mb-2">
              API Reference & System Endpoints
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm">
              REST & Streaming Endpoints powering the VentureIQ application.
            </p>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 rounded-lg bg-zinc-900 text-zinc-100 space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-bold text-[10px]">POST</span>
                <span className="text-emerald-400">/api/validations</span>
              </div>
              <p className="text-zinc-400 text-[11px] font-sans">Initializes multi-agent validation sequence for a given concept input string.</p>
            </div>

            <div className="p-3 rounded-lg bg-zinc-900 text-zinc-100 space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-purple-600 text-white font-bold text-[10px]">GET</span>
                <span className="text-emerald-400">/api/validations/stream</span>
              </div>
              <p className="text-zinc-400 text-[11px] font-sans">Server-Sent Events (SSE) endpoint broadcasting live agent outputs as cards generate.</p>
            </div>

            <div className="p-3 rounded-lg bg-zinc-900 text-zinc-100 space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-bold text-[10px]">POST</span>
                <span className="text-emerald-400">/api/ai/fix-text</span>
              </div>
              <p className="text-zinc-400 text-[11px] font-sans">Gemini-backed LLM text polisher endpoint for elevator pitch and thesis refinement.</p>
            </div>

            <div className="p-3 rounded-lg bg-zinc-900 text-zinc-100 space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-bold text-[10px]">POST</span>
                <span className="text-emerald-400">/api/diligence</span>
              </div>
              <p className="text-zinc-400 text-[11px] font-sans">Triggers LangGraph multi-step diligence graph analysis for institutional investors.</p>
            </div>
          </div>
        </div>
      )
    }
  ];

  const currentSection = docSections.find(s => s.id === activeTab) || docSections[0];

  const filteredSections = docSections.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white dark:bg-[#0e0e11] text-zinc-900 dark:text-zinc-100 flex flex-col font-sans">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-[#0e0e11]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className="flex items-center gap-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </Link>
            <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-800" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#d4f96a] text-black font-extrabold text-sm flex items-center justify-center">
                V
              </div>
              <span className="font-bold text-base tracking-tight font-serif text-zinc-900 dark:text-white">
                VentureIQ <span className="text-xs font-sans font-semibold text-zinc-400 dark:text-zinc-500">Docs</span>
              </span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2.5 px-4 py-2 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus-within:border-[#86be14] dark:focus-within:border-[#d4f96a] transition-all w-72">
            <Search className="w-4 h-4 text-zinc-400 shrink-0" />
            <input
              type="text"
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-500 focus:outline-none"
            />
          </div>
        </div>
      </header>

      {/* Main Documentation Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        {/* Sidebar */}
        <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 p-6 shrink-0 hidden md:block space-y-6">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-zinc-400 dark:text-zinc-500 block mb-3">
              DOCUMENTATION INDEX
            </span>
            <nav className="space-y-1">
              {filteredSections.map((sec) => {
                const Icon = sec.icon;
                const isActive = activeTab === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => setActiveTab(sec.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                      isActive 
                        ? "bg-[#86be14]/15 dark:bg-[#d4f96a]/15 text-[#6a990a] dark:text-[#d4f96a]" 
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{sec.title}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-4 rounded-xl bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 space-y-2">
            <span className="text-xs font-bold text-zinc-900 dark:text-white block">Need Developer Support?</span>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-snug">
              Access live agent stream logs, database schemas, and Next.js configuration docs.
            </p>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-6 md:p-12 max-w-4xl">
          {currentSection.content}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-6 text-center text-xs text-zinc-500 dark:text-zinc-500">
        <p>© 2026 VentureIQ Platform. Complete System & Software Documentation.</p>
      </footer>
    </div>
  );
}
