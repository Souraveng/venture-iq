"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}
import {
  Globe,
  Hexagon,
  Gem,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  FileText,
  Eye,
  ArrowRight,
  Sun,
  Moon
} from "lucide-react";

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeCardIndex, setActiveCardIndex] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Background Dot Connect & Mouse Repulsion Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Array<{
      x: number;
      y: number;
      baseX: number;
      baseY: number;
      vx: number;
      vy: number;
      radius: number;
    }> = [];
    
    const particleCount = 80;
    const connectionDistance = 110;
    const repulsionRadius = 150;
    const repulsionForceMultiplier = 0.8;

    const mouse = {
      x: -9999,
      y: -9999
    };

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    const initParticles = () => {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        particles.push({
          x,
          y,
          baseX: x,
          baseY: y,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          radius: Math.random() * 2 + 1
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update & Draw Particles
      particles.forEach((p) => {
        // Natural velocity movement
        p.x += p.vx;
        p.y += p.vy;

        // Bounce on boundary
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        // Mouse Repulsion Calculation
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < repulsionRadius) {
          const force = (repulsionRadius - dist) / repulsionRadius; // Force increases as distance decreases
          const angle = Math.atan2(dy, dx);
          
          // Push particle away from mouse
          p.x += Math.cos(angle) * force * 4 * repulsionForceMultiplier;
          p.y += Math.sin(angle) * force * 4 * repulsionForceMultiplier;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(212, 249, 106, 0.3)";
        ctx.fill();
      });

      // Draw Connection Lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDistance) {
            const alpha = (1 - dist / connectionDistance) * 0.15;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(212, 249, 106, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    
    resizeCanvas();
    draw();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // GSAP Entry Animations
  // GSAP Entry Animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero text loads instantly without transition delay

      // ScrollTrigger for the 5 Agent Cards - animated on load to prevent scroll-blocking visibility issues
      gsap.fromTo(
        ".animate-card",
        { 
          opacity: 0, 
          y: 50,
          scale: 0.93,
          rotationX: 10,
          transformOrigin: "bottom center"
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          rotationX: 0,
          duration: 0.8,
          delay: 0.45,
          stagger: 0.08,
          ease: "power2.out"
        }
      );

      // ScrollTrigger for the 3 Feature Cards - animated on load to prevent scroll-blocking visibility issues
      gsap.fromTo(
        ".animate-feature-card",
        {
          opacity: 0,
          y: 40,
          scale: 0.95
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          delay: 0.75,
          stagger: 0.1,
          ease: "power2.out"
        }
      );
    }, containerRef);

    return () => {
      if (ctx) ctx.revert();
    };
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen bg-[#0e0e0e] text-[#e2e2e2] flex flex-col justify-between font-sans relative selection:bg-[#d4f96a] selection:text-black">
      
      {/* Background Animated Connecting Dots Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none opacity-80" />

      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-[#d4f96a]/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Header */}
      <header className="sticky top-0 z-50 w-full border-b border-black/5 dark:border-white/5 bg-[#f6f6f6]/60 dark:bg-[#0e0e0e]/60 backdrop-blur-lg shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#d4f96a] text-black font-extrabold text-lg flex items-center justify-center">
              V
            </div>
            <span className="text-xl font-bold tracking-tight text-white font-serif">VentureIQ</span>
          </div>

          <nav className="flex items-center gap-4 sm:gap-6 text-xs font-semibold text-[#e2e2e2]">
            <Link href="/documentation" className="hover:text-[#d4f96a] transition-colors hidden sm:inline-block">Documentation</Link>
            <Link href="/login-role" className="hover:text-[#d4f96a] transition-colors">Sign In</Link>
            
            {/* Sliding Theme Toggle (Premium Capsule Switch) */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="w-14 h-7 rounded-full p-0.5 bg-neutral-200 dark:bg-black border border-neutral-300 dark:border-zinc-800 flex items-center relative transition-colors cursor-pointer shrink-0 ml-2"
                aria-label="Toggle Theme"
              >
                <div
                  className={`w-5.5 h-5.5 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 dark:from-zinc-900 dark:to-black border border-amber-300 dark:border-zinc-700 flex items-center justify-center shadow-md transform transition-transform duration-300 z-10 ${
                    theme === "dark" ? "translate-x-7" : "translate-x-0"
                  }`}
                >
                  {theme === "dark" ? (
                    <Moon className="w-3 h-3 text-white" />
                  ) : (
                    <Sun className="w-3 h-3 text-white" />
                  )}
                </div>
                {/* Background Icons */}
                <div className="absolute inset-0 flex justify-between items-center px-2 pointer-events-none">
                  <Sun className={`w-3 h-3 text-amber-500 transition-opacity duration-300 ${theme === "dark" ? "opacity-50" : "opacity-0"}`} />
                  <Moon className={`w-3 h-3 text-zinc-500 transition-opacity duration-300 ${theme === "dark" ? "opacity-0" : "opacity-50"}`} />
                </div>
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-6xl mx-auto px-6 py-12 md:py-20 relative z-10 flex-1 flex flex-col items-center">
        
        {/* Title & Subtitle */}
        <div className="text-center max-w-3xl mb-12 space-y-6">
          <h1 className="animate-fade text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.1] font-serif">
            Validate <span className="text-[#d4f96a]">venture concepts</span> <br className="hidden sm:inline" />
            with multi-agent intelligence.
          </h1>
          <p className="animate-fade text-white/60 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            VentureIQ is the operating system for autonomous venture validation. Deploy a coordinated network of 7 AI agents to research, analyze, and grade your business ideas instantly.
          </p>
          <div className="animate-fade pt-2">
            <button
              onClick={() => router.push("/login-role")}
              className="px-8 py-3.5 rounded-full font-bold text-black bg-[#d4f96a] hover:bg-[#c2e45d] transition-all text-xs flex items-center gap-2 mx-auto shadow-lg shadow-[#d4f96a]/15 hover:scale-105"
            >
              Get started for free <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 7 AI Agents Section */}
        <div className="w-full mt-12 mb-20 text-center space-y-12">
          <div className="space-y-3">
            <h2 className="animate-fade text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white font-serif">
              7 AI agents. One complete analysis.
            </h2>
            <p className="animate-fade text-zinc-600 dark:text-white/50 text-xs sm:text-sm max-w-xl mx-auto">
              Each agent specializes in a distinct facet of venture validation to deliver objective, investor-grade analysis across all 7 dimensions.
            </p>
          </div>

          {/* Cards Grid: 2 Rows (4 + 3 centered) */}
          <div className="space-y-4 max-w-5xl mx-auto relative">
            {/* Mobile backdrop click target to close tooltip */}
            {activeCardIndex !== null && (
              <div
                className="fixed inset-0 z-40 sm:hidden"
                onClick={() => setActiveCardIndex(null)}
              />
            )}

            {/* Top Row: 4 cards */}
            <div className="animate-card-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-start">
              {[
                {
                  id: 0,
                  title: "Market Research",
                  desc: "TAM/SAM/SOM breakdown, market growth trends & target persona demand",
                  icon: Globe,
                  glow: "from-blue-500/30 via-cyan-500/20 to-transparent",
                  borderHover: "group-hover:border-cyan-500/60 dark:group-hover:border-cyan-400/60",
                  confidence: 94,
                  summary: "Extensive market demand detected across US and European markets for automated technical screening.",
                  dataPoints: [
                    "TAM: $4.5B globally for recruitment tech",
                    "CAGR: 12.4% projected 5-yr growth",
                    "Enterprise demand: 68% expanding remote hiring"
                  ],
                  tags: ["High Demand", "B2B SaaS", "Global Reach"]
                },
                {
                  id: 1,
                  title: "Competitor Analysis",
                  desc: "SWOT matrix, direct/indirect positioning & competitive moat analysis",
                  icon: Hexagon,
                  glow: "from-purple-500/30 via-pink-500/20 to-transparent",
                  borderHover: "group-hover:border-purple-500/60 dark:group-hover:border-purple-400/60",
                  confidence: 88,
                  summary: "Market is crowded but highly fragmented. Legacy players suffer from rigid assessments and high latency.",
                  dataPoints: [
                    "Turing/Toptal: High margin but manual matching",
                    "HackerRank: Rigid environment & dated UX",
                    "Your Edge: Contextual LLM interviews"
                  ],
                  tags: ["Fragmented", "UX Advantage", "LLM Native"]
                },
                {
                  id: 2,
                  title: "Risk Assessment",
                  desc: "Operational red flags, compliance threats & strategic mitigation plans",
                  icon: AlertTriangle,
                  glow: "from-amber-500/30 via-red-500/20 to-transparent",
                  borderHover: "group-hover:border-amber-500/60 dark:group-hover:border-amber-400/60",
                  confidence: 91,
                  summary: "Primary risks lie in AI bias and enterprise compliance standards (GDPR / SOC2 Type II).",
                  dataPoints: [
                    "Compliance Risk: High (Requires SOC2 Type II)",
                    "Technical Risk: Medium (LLM hallucination control)",
                    "Mitigation: Human-in-the-loop review pipeline"
                  ],
                  tags: ["SOC2 Required", "AI Bias Risk", "Mitigated"]
                },
                {
                  id: 3,
                  title: "Financial Modeler",
                  desc: "3-year revenue projections, unit economics, CAC/LTV & burn rate calculations",
                  icon: Gem,
                  glow: "from-emerald-500/30 via-teal-500/20 to-transparent",
                  borderHover: "group-hover:border-emerald-500/60 dark:group-hover:border-emerald-400/60",
                  confidence: 85,
                  summary: "Highly scalable SaaS model. Initial burn is engineering-heavy followed by high-margin licensing.",
                  dataPoints: [
                    "Year 1 Burn: ~$1.2M (ML & data pipeline)",
                    "Target ARR (Y2): $3M at $25k ACV",
                    "Gross Margin: 88% at enterprise scale"
                  ],
                  tags: ["88% Gross Margin", "Enterprise ACV", "Scalable"]
                },
              ].map((card) => {
                const Icon = card.icon;
                const isActive = activeCardIndex === card.id;
                return (
                  <div
                    key={card.id}
                    onClick={() => setActiveCardIndex(isActive ? null : card.id)}
                    className={`animate-card relative p-6 rounded-2xl bg-white dark:bg-[#141416]/95 border border-zinc-200 dark:border-white/10 hover:border-[#86be14] dark:hover:border-[#d4f96a]/60 transition-all duration-300 flex flex-col items-start text-left gap-3 group cursor-pointer shadow-lg hover:shadow-xl dark:shadow-xl dark:hover:shadow-[#d4f96a]/15 hover:-translate-y-1 ${card.borderHover} ${isActive ? "border-[#86be14] dark:border-[#d4f96a]/60 z-30" : ""}`}
                  >
                    {/* Top Glow Accent */}
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.glow} opacity-80 dark:opacity-60 group-hover:opacity-100 transition-opacity rounded-t-2xl`} />
                    
                    <div className="w-full flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-white/5 text-zinc-900 dark:text-[#d4f96a] group-hover:bg-[#86be14] dark:group-hover:bg-[#d4f96a] group-hover:text-white dark:group-hover:text-black flex items-center justify-center transition-all duration-300 shadow-sm shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <h3 className="font-bold text-zinc-900 dark:text-white text-base group-hover:text-[#6a990a] dark:group-hover:text-[#d4f96a] transition-colors tracking-tight flex items-center gap-2">
                        {card.title}
                      </h3>
                      <p className="text-zinc-600 dark:text-white/60 leading-relaxed text-xs font-normal">
                        {card.desc}
                      </p>
                    </div>

                    {/* FLOATING SCREEN TIP / TOOLTIP (CLICK ON MOBILE / HOVER ON DESKTOP) */}
                    <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-[calc(100vw-3rem)] sm:w-72 max-w-xs p-4 rounded-xl bg-white dark:bg-[#0a0a0c]/98 border border-zinc-300 dark:border-white/20 shadow-2xl backdrop-blur-xl transition-all duration-300 z-50 transform ${
                      isActive 
                        ? "opacity-100 pointer-events-auto translate-y-0" 
                        : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-hover:translate-y-0 translate-y-2"
                    }`}>
                      {/* Tooltip Arrow Notch */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-3 h-3 bg-white dark:bg-[#0a0a0c] border-r border-b border-zinc-300 dark:border-white/20 rotate-45" />

                      <div className="relative space-y-2.5">
                        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/10 pb-2">
                          <span className="font-bold text-zinc-900 dark:text-white text-xs tracking-tight">{card.title} Insights</span>
                          <span className="font-mono font-bold text-emerald-700 dark:text-[#d4f96a] text-[10px] bg-emerald-50 dark:bg-[#d4f96a]/15 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-[#d4f96a]/30">
                            {card.confidence}% Match
                          </span>
                        </div>

                        <p className="text-[11px] text-zinc-600 dark:text-white/70 italic leading-snug">
                          "{card.summary}"
                        </p>

                        <div className="space-y-1 pt-1">
                          <span className="text-[9px] uppercase tracking-wider font-semibold text-zinc-400 dark:text-white/40 block">Key Analysis Data</span>
                          <ul className="space-y-1">
                            {card.dataPoints.map((point, pIdx) => (
                              <li key={pIdx} className="text-[10px] text-zinc-800 dark:text-white/90 flex items-start gap-1.5 leading-snug">
                                <span className="text-emerald-600 dark:text-[#d4f96a] text-[10px]">✦</span>
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="flex flex-wrap gap-1 pt-1 border-t border-zinc-200 dark:border-white/10">
                          {card.tags.map((tag, tIdx) => (
                            <span key={tIdx} className="text-[9px] font-mono bg-zinc-100 dark:bg-[#d4f96a]/10 text-zinc-800 dark:text-[#d4f96a] px-1.5 py-0.5 rounded border border-zinc-200 dark:border-[#d4f96a]/20">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Row: 3 cards centered */}
            <div className="animate-card-grid grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto items-start">
              {[
                {
                  id: 4,
                  title: "Pitch Framing",
                  desc: "Elevator pitch structure, investor narrative hooks & core value proposition",
                  icon: Sparkles,
                  glow: "from-amber-400/30 via-yellow-500/20 to-transparent",
                  borderHover: "group-hover:border-amber-500/60 dark:group-hover:border-amber-400/60",
                  confidence: 95,
                  summary: "Positioned as the 'Copilot for Technical Recruiters' with aggressive focus on time-to-hire metrics.",
                  dataPoints: [
                    "Hook: Cut technical hiring loop time by 73%",
                    "Core Metric: 45 days down to 12 days",
                    "Seed Ask: $2M to scale specialized eval models"
                  ],
                  tags: ["Seed Stage", "Time-to-Hire", "Strong Hook"]
                },
                {
                  id: 5,
                  title: "Execution Roadmap",
                  desc: "6-month dev milestones, integration targets & go-to-market timeline",
                  icon: FileText,
                  glow: "from-indigo-500/30 via-blue-500/20 to-transparent",
                  borderHover: "group-hover:border-indigo-500/60 dark:group-hover:border-indigo-400/60",
                  confidence: 89,
                  summary: "Structured 6-month roadmap prioritizing ATS ecosystem integrations (Greenhouse, Lever).",
                  dataPoints: [
                    "Q1: Core LLM Evaluation Engine MVP",
                    "Q2: Greenhouse & Lever native plugins",
                    "Q3: Design partner beta (10 tech enterprises)"
                  ],
                  tags: ["Integrations", "ATS Plugins", "Beta Launch"]
                },
                {
                  id: 6,
                  title: "Venture Validation",
                  desc: "Synthesized readiness score, overall grade & final investment verdict",
                  icon: Eye,
                  glow: "from-lime-500/30 via-emerald-500/20 to-transparent",
                  borderHover: "group-hover:border-lime-500/60 dark:group-hover:border-lime-400/60",
                  confidence: 96,
                  summary: "High founder-market fit paired with huge market tailwinds yields an A-Grade venture verdict.",
                  dataPoints: [
                    "Founder Fit: Verified (Ex-Big Tech Team)",
                    "Market Timing: Excellent (Remote hiring scale)",
                    "Verdict: PROCEED TO SEED FUNDRAISING"
                  ],
                  tags: ["Investable", "Grade A", "High Conviction"]
                },
              ].map((card) => {
                const Icon = card.icon;
                const isActive = activeCardIndex === card.id;
                return (
                  <div
                    key={card.id}
                    onClick={() => setActiveCardIndex(isActive ? null : card.id)}
                    className={`animate-card relative p-6 rounded-2xl bg-white dark:bg-[#141416]/95 border border-zinc-200 dark:border-white/10 hover:border-[#86be14] dark:hover:border-[#d4f96a]/60 transition-all duration-300 flex flex-col items-start text-left gap-3 group cursor-pointer shadow-lg hover:shadow-xl dark:shadow-xl dark:hover:shadow-[#d4f96a]/15 hover:-translate-y-1 ${card.borderHover} ${isActive ? "border-[#86be14] dark:border-[#d4f96a]/60 z-30" : ""}`}
                  >
                    {/* Top Glow Accent */}
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.glow} opacity-80 dark:opacity-60 group-hover:opacity-100 transition-opacity rounded-t-2xl`} />

                    <div className="w-full flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-white/5 text-zinc-900 dark:text-[#d4f96a] group-hover:bg-[#86be14] dark:group-hover:bg-[#d4f96a] group-hover:text-white dark:group-hover:text-black flex items-center justify-center transition-all duration-300 shadow-sm shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <h3 className="font-bold text-zinc-900 dark:text-white text-base group-hover:text-[#6a990a] dark:group-hover:text-[#d4f96a] transition-colors tracking-tight flex items-center gap-2">
                        {card.title}
                      </h3>
                      <p className="text-zinc-600 dark:text-white/60 leading-relaxed text-xs font-normal">
                        {card.desc}
                      </p>
                    </div>

                    {/* FLOATING SCREEN TIP / TOOLTIP (CLICK ON MOBILE / HOVER ON DESKTOP) */}
                    <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-[calc(100vw-3rem)] sm:w-72 max-w-xs p-4 rounded-xl bg-white dark:bg-[#0a0a0c]/98 border border-zinc-300 dark:border-white/20 shadow-2xl backdrop-blur-xl transition-all duration-300 z-50 transform ${
                      isActive 
                        ? "opacity-100 pointer-events-auto translate-y-0" 
                        : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-hover:translate-y-0 translate-y-2"
                    }`}>
                      {/* Tooltip Arrow Notch */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-3 h-3 bg-white dark:bg-[#0a0a0c] border-r border-b border-zinc-300 dark:border-white/20 rotate-45" />

                      <div className="relative space-y-2.5">
                        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/10 pb-2">
                          <span className="font-bold text-zinc-900 dark:text-white text-xs tracking-tight">{card.title} Insights</span>
                          <span className="font-mono font-bold text-emerald-700 dark:text-[#d4f96a] text-[10px] bg-emerald-50 dark:bg-[#d4f96a]/15 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-[#d4f96a]/30">
                            {card.confidence}% Match
                          </span>
                        </div>

                        <p className="text-[11px] text-zinc-600 dark:text-white/70 italic leading-snug">
                          "{card.summary}"
                        </p>

                        <div className="space-y-1 pt-1">
                          <span className="text-[9px] uppercase tracking-wider font-semibold text-zinc-400 dark:text-white/40 block">Key Analysis Data</span>
                          <ul className="space-y-1">
                            {card.dataPoints.map((point, pIdx) => (
                              <li key={pIdx} className="text-[10px] text-zinc-800 dark:text-white/90 flex items-start gap-1.5 leading-snug">
                                <span className="text-emerald-600 dark:text-[#d4f96a] text-[10px]">✦</span>
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="flex flex-wrap gap-1 pt-1 border-t border-zinc-200 dark:border-white/10">
                          {card.tags.map((tag, tIdx) => (
                            <span key={tIdx} className="text-[9px] font-mono bg-zinc-100 dark:bg-[#d4f96a]/10 text-zinc-800 dark:text-[#d4f96a] px-1.5 py-0.5 rounded border border-zinc-200 dark:border-[#d4f96a]/20">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3 columns below */}
          <div className="animate-feature-grid grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            {[
              {
                title: "Real-time agent collaboration",
                desc: "Watch agents hand off work in live swimlane views. Approve, intervene, re-run any step.",
                icon: RefreshCw,
              },
              {
                title: "Investor-ready outputs",
                desc: "Auto-generate reports, financial models, SWOT analyses, and venture canvases.",
                icon: FileText,
              },
              {
                title: "Venture Readiness Score",
                desc: "Visual scoring across market, competition, finance, risk, and execution dimensions.",
                icon: Eye,
              },
            ].map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="animate-feature-card p-6 rounded-2xl bg-white dark:bg-[#131313]/90 border border-zinc-200 dark:border-white/5 hover:border-[#86be14] dark:hover:border-[#d4f96a]/30 transition-all flex items-start gap-4 text-left text-xs group cursor-pointer shadow-sm hover:shadow-md"
                >
                  <div className="w-10 h-10 rounded-full border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white group-hover:bg-[#86be14] dark:group-hover:bg-[#d4f96a] group-hover:text-white dark:group-hover:text-black flex items-center justify-center shrink-0 transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-zinc-900 dark:text-white group-hover:text-[#6a990a] dark:group-hover:text-[#d4f96a] transition-colors">{feat.title}</h3>
                    <p className="text-zinc-600 dark:text-white/50 leading-relaxed text-[11px]">{feat.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="w-full py-16 border-t border-zinc-200 dark:border-white/5 text-center space-y-6">
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white font-serif">
            Evaluate your next venture.
          </h2>
          <p className="text-zinc-600 dark:text-white/60 text-xs sm:text-sm max-w-md mx-auto">
            Deploy our multi-agent intelligence network to validate your concepts today.
          </p>
          <button
            onClick={() => router.push("/login-role")}
            className="px-8 py-3.5 rounded-full font-bold text-black bg-[#d4f96a] hover:bg-[#c2e45d] transition-all text-xs flex items-center gap-2 mx-auto shadow-lg shadow-[#d4f96a]/15 hover:scale-105"
          >
            Get Started Now <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-zinc-200 dark:border-white/5 py-8 text-center text-xs text-zinc-500 dark:text-white/30 relative z-10">
        <p>© 2026 VentureIQ Platform. Powered by Multi-Agent Intelligence.</p>
      </footer>
    </div>
  );
}
