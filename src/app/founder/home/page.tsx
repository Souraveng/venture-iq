"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { gsap } from "gsap";
import { useTheme } from "next-themes";
import {
  ShieldAlert,
  CheckCircle2,
  ArrowRight,
  ArrowLeftRight,
  TrendingUp,
  FileText,
  Users,
  Briefcase,
  Sun,
  Moon,
  Sparkles,
  ShieldCheck
} from "lucide-react";

export default function FounderHomePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [founderName, setFounderName] = useState<string>("Sarah");

  useEffect(() => {
    setMounted(true);
    fetch("/api/founder/profile")
      .then((res) => res.json())
      .then((json: any) => {
        if (json.success && json.data?.fullName) {
          const firstName = json.data.fullName.split(" ")[0];
          setFounderName(firstName);
        }
      })
      .catch((err) => console.error("Failed to load founder profile:", err));
  }, []);



  return (
    <div ref={containerRef} className="min-h-screen bg-neutral-50 dark:bg-[#0e0e0e] text-neutral-800 dark:text-[#e2e2e2] font-sans pb-12 transition-colors duration-200">
      
      {/* Top Navigation Bar */}
      <header className="flex justify-between items-center h-16 px-8 bg-white dark:bg-[#0a0a0a] border-b border-neutral-200 dark:border-white/10 fixed top-0 left-0 w-full z-40 transition-colors duration-200">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#ccf063] rounded-lg flex items-center justify-center text-black font-extrabold text-lg">
              V
            </div>
            <span className="text-black dark:text-white font-semibold text-lg tracking-tight font-serif">VentureIQ</span>
          </div>
          {/* Overview text removed */}
        </div>
        <div className="flex items-center gap-3">
          {/* Sliding Theme Toggle (Premium Capsule Switch) */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="w-16 h-8 rounded-full p-1 bg-neutral-200 dark:bg-zinc-950 border border-neutral-300 dark:border-zinc-800/80 flex items-center relative transition-colors cursor-pointer shrink-0 scale-90"
              aria-label="Toggle Theme"
            >
              <div
                className={`w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 dark:from-zinc-800 dark:to-zinc-900 border dark:border-zinc-700 flex items-center justify-center shadow-md transform transition-transform duration-300 z-10 ${
                  theme === "dark" ? "translate-x-8" : "translate-x-0"
                }`}
              >
                {theme === "dark" ? (
                  <Moon className="w-3.5 h-3.5 text-white" />
                ) : (
                  <Sun className="w-3.5 h-3.5 text-white" />
                )}
              </div>
              {/* Background Icons */}
              <div className="absolute inset-0 flex justify-between items-center px-2.5 pointer-events-none">
                <Sun className={`w-3.5 h-3.5 text-amber-500 transition-opacity duration-300 ${theme === "dark" ? "opacity-50" : "opacity-0"}`} />
                <Moon className={`w-3.5 h-3.5 text-zinc-500 transition-opacity duration-300 ${theme === "dark" ? "opacity-0" : "opacity-50"}`} />
              </div>
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto pt-28 px-6 space-y-12">
        
        {/* Welcome Header */}
        <div className="space-y-3 text-left border-b border-neutral-200 dark:border-white/5 pb-8 animate-item">
          <span className="text-[#ccf063] font-bold text-xs uppercase tracking-widest block font-mono">Founder Hub</span>
          <h2 className="text-4xl sm:text-5xl font-serif text-neutral-900 dark:text-white italic leading-tight">Welcome back, {founderName}.</h2>
          <p className="text-xs text-neutral-500 dark:text-[#c5c9b2] max-w-2xl leading-relaxed">
            Select your primary objective for today. VentureIQ’s intelligent workspace is ready to accelerate your trajectory.
          </p>
        </div>

        {/* Choice Option Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-item">
          
          {/* Card 1: Startup Validation */}
          <div 
            onClick={() => router.push("/founder/validation")}
            className="group relative bg-white dark:bg-[#1f1f1f] border border-neutral-200 dark:border-white/10 p-10 rounded-2xl flex flex-col justify-between hover:border-[#ccf063] dark:hover:border-[#ccf063] transition-all duration-300 overflow-hidden shadow-md dark:shadow-xl min-h-[320px] cursor-pointer hover:-translate-y-1"
          >
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#ccf063]/5 rounded-full blur-[100px]" />
            
            <div>
              <div className="mb-6 w-14 h-14 bg-neutral-100 dark:bg-black/40 border border-neutral-200 dark:border-white/5 rounded-xl flex items-center justify-center text-[#ccf063] group-hover:scale-105 transition-transform">
                <ArrowLeftRight className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-3 font-serif group-hover:text-[#86be14] dark:group-hover:text-[#ccf063] transition-colors">Continue Startup Validation</h3>
              <p className="text-xs text-neutral-550 dark:text-[#c5c9b2] leading-relaxed mb-6">
                Access your research workbench, refine your market hypothesis, and review AI-generated sentiment analysis from your recent beta testing phase.
              </p>
            </div>

            <div className="flex items-center justify-between mt-auto">
              <span className="text-sm text-neutral-400 dark:text-white/40">Tier 1 Active</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push("/founder/validation");
                }}
                className="flex items-center gap-1.5 bg-[#ccf063] hover:bg-[#c2e45d] text-black px-6 py-3 rounded-full font-bold text-xs hover:scale-102 transition-transform shadow-md shadow-[#ccf063]/10 animate-item cursor-pointer"
              >
                Open Workspace <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 2: Raise Investment */}
          <div 
            onClick={() => router.push("/founder/fundraising")}
            className="group relative bg-white dark:bg-[#1f1f1f] border border-neutral-200 dark:border-white/10 p-10 rounded-2xl flex flex-col justify-between hover:border-[#ccf063] dark:hover:border-[#ccf063] transition-all duration-300 overflow-hidden shadow-md dark:shadow-xl min-h-[320px] cursor-pointer hover:-translate-y-1"
          >
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#ccf063]/5 rounded-full blur-[100px]" />
            
            <div>
              <div className="mb-6 w-14 h-14 bg-neutral-100 dark:bg-black/40 border border-neutral-200 dark:border-white/5 rounded-xl flex items-center justify-center text-[#ccf063] group-hover:scale-105 transition-transform">
                <TrendingUp className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-3 font-serif group-hover:text-[#86be14] dark:group-hover:text-[#ccf063] transition-colors">Raise Investment</h3>
              <p className="text-xs text-neutral-550 dark:text-[#c5c9b2] leading-relaxed mb-6">
                Manage your cap table, optimize your data room, and initiate outreach to the top 50 venture firms currently investing in your sector.
              </p>
            </div>

            <div className="flex items-center justify-between mt-auto">
              <span className="text-sm text-[#ccf063] font-semibold">3 Active Rounds</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push("/founder/fundraising");
                }}
                className="flex items-center gap-1.5 bg-[#ccf063] hover:bg-[#c2e45d] text-black px-6 py-3 rounded-full font-bold text-xs hover:scale-102 transition-transform shadow-md shadow-[#ccf063]/10 animate-item cursor-pointer"
              >
                Open Fundraising <TrendingUp className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

        {/* Modern SaaS Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-item pt-4">
          {[
            { 
              badge: "Pitch Sandbox", 
              title: "Interactive Video Reel", 
              desc: "Upload, preview, and refine your pitch video. Experience exactly what investors see and polish your narrative before publishing.", 
              icon: ArrowLeftRight 
            },
            { 
              badge: "AI Co-Pilot", 
              title: "Diligence Analytics", 
              desc: "Simulate investor diligence runs. Run semantic model scans over your metrics, team roster, and TAM size to identify readiness gaps.", 
              icon: Sparkles 
            },
            { 
              badge: "Deal Engine", 
              title: "Secure Gating Control", 
              desc: "Granular access control. Keep financial models, business plans, and pitch decks locked, approving investor requests one-by-one.", 
              icon: ShieldCheck 
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-white dark:bg-[#121212]/75 border border-neutral-200 dark:border-white/5 p-6 rounded-2xl flex flex-col justify-between min-h-[200px] cursor-pointer hover:bg-neutral-50 dark:hover:bg-[#1c1c1c]/90 hover:border-[#ccf063]/30 dark:hover:border-[#ccf063]/30 transition-all duration-300 shadow-sm hover:shadow-md group relative overflow-hidden"
              >
                <div className="absolute -top-12 -right-12 w-24 h-24 bg-[#ccf063]/5 rounded-full blur-[40px] group-hover:bg-[#ccf063]/10 transition-colors" />
                
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#ccf063] bg-[#ccf063]/10 dark:bg-[#ccf063]/10 border border-[#ccf063]/25 px-2.5 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                    <Icon className="w-4 h-4 text-neutral-400 group-hover:text-[#ccf063] transition-colors" />
                  </div>
                  
                  <h4 className="text-base font-bold text-neutral-900 dark:text-white mb-2 font-serif">
                    {item.title}
                  </h4>
                  
                  <p className="text-xs text-neutral-500 dark:text-[#c5c9b2]/85 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
