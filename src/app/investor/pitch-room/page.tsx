"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import {
  Rocket,
  Send,
  MessageSquare,
  PlayCircle,
  TrendingUp,
  Award,
  ShieldCheck,
  CheckCircle2,
  Users
} from "lucide-react";


export default function StartupPitchRoomPublicViewPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleInvest = () => {

  };

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
      
      {/* Top Header details */}
      <div className="animate-item flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-[#ccf063]/10 border border-[#ccf063]/30 text-[#ccf063] px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider">
              DeepTech
            </span>
          </div>
          <h1 className="text-4xl font-serif text-white italic mb-2"></h1>
          <p className="text-xs text-[#c5c9b2] max-w-xl leading-relaxed">
            Pioneering the next generation of neuromorphic computing. We are building the hardware-software stack that allows AI agents to learn in real-time.
          </p>
        </div>
        <div className="flex flex-col gap-2 w-full md:w-auto">
          <button
            onClick={handleInvest}
            className="bg-[#ccf063] hover:bg-[#c2e45d] text-black font-bold py-3.5 px-6 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-[#ccf063]/10"
          >
            <Rocket className="w-4 h-4 fill-current" /> Invest Now
          </button>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button className="py-2.5 px-4 bg-[#1f1f1f] border border-white/10 hover:bg-[#2a2a2a] text-white font-bold rounded-xl flex items-center justify-center gap-1.5">
              <Send className="w-3.5 h-3.5" /> Send Offer
            </button>
            <button className="py-2.5 px-4 bg-[#1f1f1f] border border-white/10 hover:bg-[#2a2a2a] text-white font-bold rounded-xl flex items-center justify-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" /> Message
            </button>
          </div>
        </div>
      </div>

      {/* Embedded Presentation cover */}
      <div className="animate-item aspect-video w-full rounded-2xl bg-black border border-white/10 relative flex items-center justify-center cursor-pointer overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
        <PlayCircle className="w-16 h-16 text-white opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all z-20" />
        <div className="absolute bottom-6 left-6 z-20 text-xs">
          <p className="font-bold text-white text-sm">Series A Pitch Narrative</p>
          <p className="text-[#c5c9b2]">Presented by Swapn Kumar, CEO</p>
        </div>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Growth Traction Column */}
        <div className="animate-item lg:col-span-2 bg-[#1f1f1f] border border-white/10 rounded-2xl p-6 space-y-6">
          <h3 className="text-lg font-bold text-white font-serif">Growth Traction</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-black/40 border border-white/5 rounded-xl">
              <span className="text-[#c5c9b2] text-[9px] uppercase tracking-wider">Annual Recurring Revenue</span>
              <p className="text-2xl font-bold text-[#ccf063] mt-1">$4.2M</p>
              <p className="text-[10px] text-green-400 flex items-center gap-0.5 mt-1">
                <TrendingUp className="w-3 h-3" /> 14% MoM
              </p>
            </div>
            <div className="p-4 bg-black/40 border border-white/5 rounded-xl">
              <span className="text-[#c5c9b2] text-[9px] uppercase tracking-wider">Pilot Customers</span>
              <p className="text-2xl font-bold text-white mt-1">12</p>
              <p className="text-[10px] text-[#c5c9b2] mt-1">Fortune 500 Enterprise</p>
            </div>
            <div className="p-4 bg-black/40 border border-white/5 rounded-xl">
              <span className="text-[#c5c9b2] text-[9px] uppercase tracking-wider">Efficiency Gain</span>
              <p className="text-2xl font-bold text-white mt-1">1,200x</p>
              <p className="text-[10px] text-[#ccf063] mt-1">Vs. Industry Standard</p>
            </div>
          </div>
        </div>

        {/* Market Opportunity */}
        <div className="animate-item bg-[#1f1f1f] border border-white/10 rounded-2xl p-6 space-y-4 text-xs">
          <h3 className="text-sm font-bold text-[#ccf063] uppercase tracking-widest font-serif">Market Strategy</h3>
          <p className="text-[#c5c9b2] leading-relaxed text-[11px]">
            Targeting the $200B Edge AI market with active partnerships in medical robotics and autonomous driving.
          </p>
          <div className="space-y-2 text-[11px]">
            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span className="text-[#c5c9b2]">TAM</span>
              <span className="font-bold text-white">$450 Billion</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-[#c5c9b2]">SAM</span>
              <span className="font-bold text-white">$12.4 Billion</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
