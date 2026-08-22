"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import {
  ShieldAlert,
  ArrowRight,
  Upload,
  CheckCircle2,
  Building,
  User,
  DollarSign,
  FileCheck
} from "lucide-react";

export default function StartupVerificationFormPage() {
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
      
      {/* Page Header Section */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-white/5 pb-6">
        <div className="animate-item space-y-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#1f1f1f] border border-[#454937]/50 rounded-full text-sm font-bold text-red-400">
              <ShieldAlert className="w-3.5 h-3.5" /> Not Verified
            </span>
            <span className="text-[#c5c9b2] text-xs">/</span>
            <span className="text-[#ccf063] text-xs font-semibold">Application ID: VQ-882-91</span>
          </div>
          <h2 className="text-4xl font-serif text-white leading-tight">Startup Verification Application</h2>
          <p className="text-xs text-[#c5c9b2] max-w-xl">
            Complete your institutional-grade verification to unlock investor-direct features, capital deployment queues, and the VentureIQ Trust Seal.
          </p>
        </div>
        <div className="animate-item flex gap-3 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none px-6 py-3 rounded-xl border border-[#454937]/50 text-white hover:bg-[#1f1f1f] text-xs font-semibold">
            Save Draft
          </button>
          <button className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-[#ccf063] text-black font-bold text-xs hover:scale-102 transition-transform">
            Start Verification
          </button>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Form Sections */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section 1: Company Information */}
          <section className="animate-item bg-[#1f1f1f] border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-bold text-white font-serif flex items-center gap-2">
                <Building className="w-5 h-5 text-[#ccf063]" /> Company Information
              </h3>
              <span className="text-sm text-[#c5c9b2] font-semibold">Step 01 / 04</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="block text-[#c5c9b2]">Legal Entity Name</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Ventures Inc."
                  className="w-full bg-[#131313] border border-[#454937]/50 rounded-xl p-3 text-white focus:outline-none focus:border-[#ccf063] transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[#c5c9b2]">Registration Number (EIN/VAT)</label>
                <input
                  type="text"
                  placeholder="12-3456789"
                  className="w-full bg-[#131313] border border-[#454937]/50 rounded-xl p-3 text-white focus:outline-none focus:border-[#ccf063] transition-all"
                />
              </div>
            </div>
          </section>

          {/* Section 2: Founder Details */}
          <section className="animate-item bg-[#1f1f1f] border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-bold text-white font-serif flex items-center gap-2">
                <User className="w-5 h-5 text-[#ccf063]" /> Founder & Director Details
              </h3>
              <span className="text-sm text-[#c5c9b2] font-semibold">Step 02 / 04</span>
            </div>
            <div className="p-4 rounded-xl bg-black border border-white/5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-white">
                  SK
                </div>
                <div>
                  <h4 className="font-bold text-white">Swapn Kumar</h4>
                  <p className="text-sm text-[#c5c9b2]">Primary Director</p>
                </div>
              </div>
              <span className="text-sm text-[#ccf063] bg-[#ccf063]/10 px-2.5 py-1 rounded-md">
                Primary Account
              </span>
            </div>
          </section>

          {/* Section 3: Document Uploads */}
          <section className="animate-item bg-[#1f1f1f] border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-bold text-white font-serif flex items-center gap-2">
                <Upload className="w-5 h-5 text-[#ccf063]" /> Document Verification
              </h3>
              <span className="text-sm text-[#c5c9b2] font-semibold">Step 03 / 04</span>
            </div>
            <div className="p-6 border-2 border-dashed border-[#454937] hover:border-[#ccf063] bg-black/40 rounded-xl text-center cursor-pointer transition-colors duration-200">
              <Upload className="w-8 h-8 text-[#ccf063] mx-auto mb-2" />
              <p className="text-xs font-bold text-white">Upload Certificate of Incorporation</p>
              <p className="text-sm text-[#c5c9b2] mt-1">PDF, JPG, or PNG up to 10MB</p>
            </div>
          </section>

        </div>

        {/* Right Column: Information/Auditors */}
        <div className="animate-item p-6 rounded-2xl bg-[#1f1f1f] border border-white/10 space-y-6">
          <h3 className="text-lg font-bold text-white font-serif">Audit Methodology</h3>
          
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-black border border-white/5 space-y-2">
              <h4 className="font-bold text-[#ccf063] flex items-center gap-1.5">
                <FileCheck className="w-4 h-4" /> Cryptographic Ledger
              </h4>
              <p className="text-[#c5c9b2] leading-relaxed text-[11px]">
                Your compliance audit logs are hashed and registered to the VentureIQ private chain, guaranteeing data integrity.
              </p>
            </div>

            <div className="space-y-2 pt-2 text-[11px] text-[#c5c9b2]">
              <p className="flex justify-between">
                <span>Security Standard:</span>
                <span className="text-white font-semibold">SOC2 Type II</span>
              </p>
              <p className="flex justify-between">
                <span>Compliance Body:</span>
                <span className="text-white font-semibold">SEC Reg D Compliant</span>
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
