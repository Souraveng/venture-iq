"use client";

import React, { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import {
  ShieldAlert,
  CheckCircle2,
  FileText,
  Upload,
  Plus,
  Trash2,
  Users,
  ArrowRight,
  TrendingUp,
  FileCheck
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";

export default function StartupVerificationApplicationPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { activeStartup, setActiveStartup } = useAuth();
  
  const [legalName, setLegalName] = useState("");
  const [regNumber, setRegNumber] = useState("");
  const [jurisdiction, setJurisdiction] = useState("");
  const [directors, setDirectors] = useState([
    { name: "Swapn Kumar", role: "Primary Director", uploaded: true }
  ]);

  const handleStartVerification = () => {

  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".animate-item",
        { y: 6, opacity: 0.85 },
        { y: 0, opacity: 1, duration: 0.3, ease: "power2.out" }
      );
    }, containerRef);
    return () => ctx.revert();
  }, [activeStartup]);

  if (activeStartup.verified) {
    return (
      <div ref={containerRef} className="space-y-8 max-w-2xl mx-auto font-sans pb-12 text-center py-10">
        <div className="animate-item bg-[#1f1f1f] border border-white/10 rounded-2xl p-8 space-y-6 shadow-xl flex flex-col items-center">
          <div className="w-16 h-16 bg-[#ccf063]/10 border border-[#ccf063]/30 text-[#ccf063] rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 fill-black text-[#ccf063]" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-serif text-white italic">{activeStartup.name} is Verified</h2>
            <p className="text-xs text-[#c5c9b2] max-w-md mx-auto leading-relaxed">
              This startup is fully verified and active on the platform. All dashboard analytics, fundraising metrics, and investor-direct features are unlocked.
            </p>
          </div>

          <div className="border-t border-white/5 pt-6 w-full space-y-4">
            <p className="text-xs text-white/50 font-bold uppercase tracking-wider">Want to verify another startup?</p>
            <div className="flex flex-col gap-2.5 max-w-xs mx-auto">
              {[
                { name: "Aether Systems", verified: false },
                { name: "Helix Bio-Lab", verified: false }
              ].map((st) => (
                <button
                  key={st.name}
                  onClick={() => {
                    setActiveStartup(st);
                  }}
                  className="w-full py-3 bg-white/5 border border-white/10 hover:bg-[#ccf063] hover:text-black rounded-xl text-xs text-white font-bold transition-all"
                >
                  Verify {st.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-8 max-w-7xl mx-auto font-sans pb-12">
      
      {/* Top Banner Header */}
      <div className="animate-item flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-red-500/10 border border-red-500/30 text-red-400 px-2 py-0.5 rounded-full text-sm font-bold uppercase tracking-wider">
              Not Verified
            </span>
            <span className="text-[#c5c9b2] text-[11px] font-semibold">/ Application ID: VQ-882-91</span>
          </div>
          <h2 className="text-4xl font-serif text-white italic">Startup Verification: {activeStartup.name}</h2>
          <p className="text-xs text-[#c5c9b2] mt-1 max-w-xl">
            Complete your institutional-grade verification to unlock investor-direct features, capital deployment queues, and the VentureIQ Trust Seal.
          </p>
        </div>
        <div className="animate-item flex gap-3 w-full sm:w-auto text-xs">
          <button className="px-5 py-3 rounded-xl border border-white/10 bg-white/5 text-white font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-1.5">
            Save Draft
          </button>
          <button
            onClick={handleStartVerification}
            className="px-6 py-3 rounded-xl bg-[#ccf063] hover:bg-[#c2e45d] text-black font-bold transition-all hover:scale-102 flex items-center justify-center gap-1.5 shadow-md shadow-[#ccf063]/10"
          >
            Start Verification
          </button>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns: Form Fields */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card 1: Company Information */}
          <div className="animate-item bg-[#1f1f1f] border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center text-xs border-b border-white/5 pb-3">
              <h3 className="font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#ccf063]" /> Company Information
              </h3>
              <span className="text-[#c5c9b2] font-semibold">01 / 04</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="text-[#c5c9b2] text-sm uppercase font-bold tracking-wider">Legal Entity Name</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Ventures Inc."
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#ccf063]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[#c5c9b2] text-sm uppercase font-bold tracking-wider">Registration Number (EIN/VAT)</label>
                <input
                  type="text"
                  placeholder="12-3456789"
                  value={regNumber}
                  onChange={(e) => setRegNumber(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-[#ccf063]"
                />
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="text-[#c5c9b2] text-sm uppercase font-bold tracking-wider">Country of Incorporation</label>
              <select
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
              >
                <option value="">Select a jurisdiction</option>
                <option value="US">United States (Delaware)</option>
                <option value="GB">United Kingdom</option>
                <option value="SG">Singapore</option>
              </select>
            </div>
          </div>

          {/* Card 2: Founder & Director Details */}
          <div className="animate-item bg-[#1f1f1f] border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center text-xs border-b border-white/5 pb-3">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-[#ccf063]" /> Founder & Director Details
              </h3>
              <span className="text-[#c5c9b2] font-semibold">02 / 04</span>
            </div>

            <div className="space-y-3">
              {directors.map((dir, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-white text-xs">
                      SK
                    </div>
                    <div>
                      <h4 className="font-bold text-white">{dir.name}</h4>
                      <p className="text-sm text-[#c5c9b2]/60">{dir.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-md text-sm text-white/50 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-[#ccf063]" /> ID Uploaded
                    </span>
                    <button className="text-red-400 hover:text-red-500 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full py-2.5 border border-dashed border-white/20 hover:border-[#ccf063] rounded-xl text-xs font-semibold text-white/50 hover:text-[#ccf063] flex items-center justify-center gap-1 transition-all">
              <Plus className="w-4 h-4" /> Add Another Director
            </button>
          </div>

        </div>

        {/* Right Column: Institutional Vault Details */}
        <div className="space-y-6">
          
          {/* Institutional Protocol */}
          <div className="animate-item bg-[#1f1f1f] border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
            <h3 className="text-xs font-bold text-[#ccf063] uppercase tracking-widest font-mono flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" /> Institutional Protocol
            </h3>
            <p className="text-[11px] text-[#c5c9b2] leading-relaxed">
              All documents are encrypted using AES-256 standards. Your sensitive data is only accessible to verified institutional audit partners during the review window.
            </p>
            <div className="space-y-2 text-sm text-white/80">
              <p className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#ccf063]" /> Zero-knowledge proof validation</p>
              <p className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#ccf063]" /> SEC & FINRA compliance ready</p>
              <p className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#ccf063]" /> Instant shred option upon withdrawal</p>
            </div>
          </div>

          {/* Compliance Checklist */}
          <div className="animate-item bg-[#1f1f1f] border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest border-b border-white/5 pb-2">
              Compliance (KYC)
            </h3>
            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-black/45 border border-red-500/20 rounded-xl flex items-center justify-between text-white/80">
                <span>Certificate of Incorporation</span>
                <Upload className="w-4 h-4 text-red-400 cursor-pointer" />
              </div>
              <div className="p-3.5 bg-black/45 border border-white/5 rounded-xl flex items-center justify-between text-white/80">
                <span>Bank Statement (Last 3m)</span>
                <Upload className="w-4 h-4 text-white/40 cursor-pointer" />
              </div>
              <div className="p-3.5 bg-black/45 border border-white/5 rounded-xl flex items-center justify-between text-white/80">
                <span>Proof of Address</span>
                <Upload className="w-4 h-4 text-white/40 cursor-pointer" />
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
