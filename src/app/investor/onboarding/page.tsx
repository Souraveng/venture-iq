"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import {
  UserPlus,
  Compass,
  CheckCircle2,
  FileCheck,
  AlertCircle,
  TrendingUp,
  MapPin,
  Upload,
  Plus
} from "lucide-react";

export default function InvestorOnboardingPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".animate-item",
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: "power2.out" }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="space-y-8 max-w-7xl mx-auto font-sans pb-12">
      
      {/* Header Profile Hero */}
      <div className="animate-item bg-[#1f1f1f] border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-xl">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-[#454937] hover:border-[#ccf063] flex flex-col items-center justify-center bg-black cursor-pointer transition-colors duration-200">
            <Upload className="w-6 h-6 text-[#c5c9b2] mb-1" />
            <span className="text-[9px] text-[#c5c9b2] uppercase font-bold tracking-wider">Photo</span>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <h2 className="text-3xl font-bold text-white font-serif italic">Unnamed Investor</h2>
              <span className="flex items-center gap-1 bg-[#131313] border border-[#454937]/50 px-2.5 py-1 rounded-full text-[9px] font-bold text-[#c5c9b2] uppercase tracking-wider">
                Drafting Profile
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#c5c9b2]">
              <span className="bg-black/35 px-2.5 py-1 rounded-md text-[10px] text-[#c5c9b2]/60">Investor Type Not Set</span>
              <span className="flex items-center gap-1 text-[#c5c9b2]/40 italic"><MapPin className="w-3.5 h-3.5" /> Add Location...</span>
            </div>
          </div>
        </div>

        {/* Right Corner Profile Strength */}
        <div className="text-right flex items-center gap-3">
          <div className="bg-black/30 border border-white/5 p-3 rounded-xl flex items-center gap-2">
            <div>
              <p className="text-[9px] uppercase tracking-wider text-red-400 mb-1">Profile Strength</p>
              <p className="text-xl font-bold text-red-500">15%</p>
            </div>
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
        </div>
      </div>

      {/* Main Grid Onboarding steps */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Onboarding Thesis form */}
        <div className="animate-item lg:col-span-2 bg-[#1f1f1f] border border-white/10 rounded-2xl p-6 space-y-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-bold text-white font-serif">Investor Thesis</h3>
            <span className="bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
              Action Required
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="text-[#c5c9b2] uppercase font-bold tracking-wider text-[9px]">Full Name *</label>
              <input
                type="text"
                placeholder="e.g. Alex Rivero"
                className="w-full bg-[#131313] border border-[#454937]/50 rounded-xl px-3 py-2.5 text-white focus:border-[#ccf063] outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[#c5c9b2] uppercase font-bold tracking-wider text-[9px]">Investor Type *</label>
              <select className="w-full bg-[#131313] border border-[#454937]/50 rounded-xl px-3 py-2.5 text-[#c5c9b2]/60 focus:border-[#ccf063] outline-none">
                <option>Select type...</option>
                <option>Individual Angel</option>
                <option>Syndicate</option>
                <option>Micro-VC</option>
                <option>Family Office</option>
              </select>
            </div>
          </div>

          <div className="space-y-1 text-xs">
            <label className="text-[#c5c9b2] uppercase font-bold tracking-wider text-[9px]">Investment Thesis *</label>
            <textarea
              rows={3}
              placeholder="e.g. Backing early stage AI and Climate startups with ticket sizes up to $500K..."
              className="w-full bg-[#131313] border border-[#454937]/50 rounded-xl px-4 py-3 text-white focus:border-[#ccf063] outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-4 border-t border-white/5">
            <div className="space-y-2">
              <p className="text-[#c5c9b2] text-[9px] uppercase font-bold tracking-wider">Investment Focus *</p>
              <button className="bg-[#131313] border border-dashed border-[#454937] text-[#c5c9b2] px-3 py-2 rounded-xl text-[10px] flex items-center gap-1.5 hover:border-[#ccf063]">
                <Plus className="w-3.5 h-3.5" /> Add Sector
              </button>
            </div>
            <div className="space-y-2">
              <p className="text-[#c5c9b2] text-[9px] uppercase font-bold tracking-wider">Preferred Stage *</p>
              <button className="bg-[#131313] border border-dashed border-[#454937] text-[#c5c9b2] px-3 py-2 rounded-xl text-[10px] flex items-center gap-1.5 hover:border-[#ccf063]">
                <Plus className="w-3.5 h-3.5" /> Add Stage
              </button>
            </div>
          </div>
        </div>

        {/* Info Column */}
        <div className="animate-item bg-[#1f1f1f] border border-white/10 rounded-2xl p-6 space-y-4 text-xs">
          <h3 className="text-sm font-bold text-[#ccf063] uppercase tracking-widest font-serif">Onboarding Benefits</h3>
          <p className="text-[#c5c9b2] leading-relaxed">
            Verify your accredited status and thesis guidelines to unlock match-making tools with high ARR startups.
          </p>
          <button className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-xs">
            Save Draft Profile
          </button>
        </div>

      </div>
    </div>
  );
}
