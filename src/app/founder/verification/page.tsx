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
  const [directors, setDirectors] = useState<{name: string, role: string, uploaded: boolean}[]>([
    { name: activeStartup?.founder || "", role: "Primary Director", uploaded: false }
  ]);
  const [docs, setDocs] = useState({
    cert: false,
    bank: false,
    address: false
  });

  const handleStartVerification = () => {
    setActiveStartup({ ...activeStartup, verified: true });
  };
  
  const handleAddDirector = () => {
    setDirectors([...directors, { name: "", role: "Director", uploaded: false }]);
  };
  
  const handleRemoveDirector = (index: number) => {
    setDirectors(directors.filter((_, i) => i !== index));
  };
  
  const handleDirectorChange = (index: number, field: string, value: string) => {
    const newDirectors = [...directors];
    newDirectors[index] = { ...newDirectors[index], [field]: value };
    setDirectors(newDirectors);
  };
  
  const toggleUpload = (index: number) => {
    const newDirectors = [...directors];
    newDirectors[index] = { ...newDirectors[index], uploaded: !newDirectors[index].uploaded };
    setDirectors(newDirectors);
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
                <div key={idx} className="p-4 rounded-xl bg-black/40 border border-white/5 flex flex-col gap-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 w-full">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-white text-xs shrink-0">
                        {dir.name ? dir.name.substring(0, 2).toUpperCase() : "?"}
                      </div>
                      <div className="w-full space-y-2 pr-4">
                        <input 
                          type="text" 
                          value={dir.name}
                          onChange={(e) => handleDirectorChange(idx, "name", e.target.value)}
                          placeholder="Director Name"
                          className="w-full bg-transparent border-b border-white/10 text-white font-bold focus:outline-none focus:border-[#ccf063] pb-1"
                        />
                        <input 
                          type="text" 
                          value={dir.role}
                          onChange={(e) => handleDirectorChange(idx, "role", e.target.value)}
                          placeholder="Role"
                          className="w-full bg-transparent border-b border-white/10 text-[#c5c9b2]/60 text-sm focus:outline-none focus:border-[#ccf063] pb-1"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-white/5 pt-2">
                    <button 
                      onClick={() => toggleUpload(idx)}
                      className={`px-2.5 py-1 border rounded-md text-sm flex items-center gap-1 transition-colors ${dir.uploaded ? "bg-white/5 border-white/10 text-white/50" : "bg-[#ccf063]/10 border-[#ccf063]/30 text-[#ccf063]"}`}
                    >
                      {dir.uploaded ? (
                        <><CheckCircle2 className="w-3 h-3 text-[#ccf063]" /> ID Uploaded</>
                      ) : (
                        <><Upload className="w-3 h-3" /> Upload ID</>
                      )}
                    </button>
                    {directors.length > 1 && (
                      <button onClick={() => handleRemoveDirector(idx)} className="text-red-400 hover:text-red-500 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button onClick={handleAddDirector} className="w-full py-2.5 border border-dashed border-white/20 hover:border-[#ccf063] rounded-xl text-xs font-semibold text-white/50 hover:text-[#ccf063] flex items-center justify-center gap-1 transition-all cursor-pointer">
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
              <div className={`p-3.5 bg-black/45 border rounded-xl flex items-center justify-between text-white/80 transition-colors ${docs.cert ? "border-[#ccf063]/50 text-[#ccf063]" : "border-red-500/20"}`}>
                <span>Certificate of Incorporation</span>
                {docs.cert ? <CheckCircle2 className="w-4 h-4 text-[#ccf063]" /> : <Upload className="w-4 h-4 text-red-400 cursor-pointer hover:scale-110" onClick={() => setDocs({...docs, cert: true})} />}
              </div>
              <div className={`p-3.5 bg-black/45 border rounded-xl flex items-center justify-between text-white/80 transition-colors ${docs.bank ? "border-[#ccf063]/50 text-[#ccf063]" : "border-white/5"}`}>
                <span>Bank Statement (Last 3m)</span>
                {docs.bank ? <CheckCircle2 className="w-4 h-4 text-[#ccf063]" /> : <Upload className="w-4 h-4 text-white/40 cursor-pointer hover:scale-110 hover:text-white" onClick={() => setDocs({...docs, bank: true})} />}
              </div>
              <div className={`p-3.5 bg-black/45 border rounded-xl flex items-center justify-between text-white/80 transition-colors ${docs.address ? "border-[#ccf063]/50 text-[#ccf063]" : "border-white/5"}`}>
                <span>Proof of Address</span>
                {docs.address ? <CheckCircle2 className="w-4 h-4 text-[#ccf063]" /> : <Upload className="w-4 h-4 text-white/40 cursor-pointer hover:scale-110 hover:text-white" onClick={() => setDocs({...docs, address: true})} />}
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
