"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { 
  Building2, 
  MapPin, 
  Users, 
  Target, 
  TrendingUp, 
  PieChart,
  FileText,
  DollarSign,
  Briefcase,
  Globe,
  Lock,
  Unlock,
  CheckCircle2,
  Calendar,
  X
} from "lucide-react";

export interface PitchDetailsProps {
  startup: any; // The raw startup object from the backend
  onClose?: () => void;
}

export function PitchDetails({ startup, onClose }: PitchDetailsProps) {
  const { userEmail } = useAuth();

  useEffect(() => {
    if (startup?.id) {
      fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startupId: startup.id,
          eventType: "PROFILE_VIEW",
          investorEmail: userEmail,
        }),
      }).catch(() => {});
    }
  }, [startup?.id, userEmail]);

  const trackDeckView = () => {
    if (startup?.id) {
      fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startupId: startup.id,
          eventType: "DECK_VIEW",
          investorEmail: userEmail,
        }),
      }).catch(() => {});
    }
  };

  if (!startup) {
    return <div className="p-8 text-white/50 text-center">Loading pitch details...</div>;
  }

  // Helper to check if a field is gated
  const isGated = (field: string) => {
    if (!startup.gatedFields) return false;
    try {
      const gated = typeof startup.gatedFields === "string"
        ? JSON.parse(startup.gatedFields)
        : startup.gatedFields;
      if (Array.isArray(gated)) {
        return gated.includes(field);
      }
    } catch (e) {
      console.error("Failed to parse gated fields:", e);
    }
    return false;
  };

  // Helper to render public values or gate badge
  const renderValue = (fieldName: string, value: any, fallback = "N/A") => {
    if (isGated(fieldName)) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
          Locked 🔒
        </span>
      );
    }
    if (value === null || value === undefined || value === "" || value === "N/A") {
      return <span className="text-white/40">{fallback}</span>;
    }
    return <span className="text-white font-semibold text-sm">{value}</span>;
  };



  const renderUseOfFunds = () => {
    if (isGated("useOfFunds")) {
      return (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between text-xs">
          <span className="text-white/60">Use of Funds</span>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
            Locked 🔒
          </span>
        </div>
      );
    }

    let uofList: any[] = [];
    if (startup.useOfFunds) {
      try {
        uofList = typeof startup.useOfFunds === "string" 
          ? JSON.parse(startup.useOfFunds) 
          : startup.useOfFunds;
      } catch (e) {
        console.error("Failed to parse useOfFunds", e);
      }
    }

    if (!Array.isArray(uofList) || uofList.length === 0) {
      return null;
    }

    return (
      <section className="space-y-3">
        <h3 className="text-xs font-bold text-white/80 uppercase tracking-wider">Use of Funds</h3>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3.5">
          <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden flex">
            {uofList.map((item: any, idx: number) => {
              const colors = ["bg-[#ccf063]", "bg-teal-400", "bg-sky-400", "bg-purple-400", "bg-amber-400"];
              const color = colors[idx % colors.length];
              return (
                <div 
                  key={idx} 
                  style={{ width: `${item.percentage}%` }} 
                  className={`${color} h-full transition-all`} 
                  title={`${item.category}: ${item.percentage}%`}
                />
              );
            })}
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {uofList.map((item: any, idx: number) => {
              const dotColors = ["bg-[#ccf063]", "bg-teal-400", "bg-sky-400", "bg-purple-400", "bg-amber-400"];
              const dotColor = dotColors[idx % dotColors.length];
              return (
                <div key={idx} className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                  <span className="text-white/70 truncate">{item.category}</span>
                  <span className="font-bold text-white ml-auto">{item.percentage}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  };

  const renderTeamRoster = () => {
    if (isGated("teamRoster")) {
      return (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between text-xs">
          <span className="text-white/60">Team Roster</span>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
            Locked 🔒
          </span>
        </div>
      );
    }

    let rosterList: any[] = [];
    if (startup.teamRoster) {
      try {
        rosterList = typeof startup.teamRoster === "string" 
          ? JSON.parse(startup.teamRoster) 
          : startup.teamRoster;
      } catch (e) {
        console.error("Failed to parse teamRoster", e);
      }
    }

    if (!Array.isArray(rosterList) || rosterList.length === 0) {
      return null;
    }

    return (
      <section className="space-y-3">
        <h3 className="text-xs font-bold text-white/80 uppercase tracking-wider">Team Roster</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {rosterList.map((member: any, idx: number) => (
            <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-3.5 flex flex-col justify-between gap-2.5">
              <div>
                <p className="font-bold text-sm text-white">{member.name || "Team Member"}</p>
                <p className="text-xs text-white/60 mt-0.5">{member.role || "Role"}</p>
              </div>
              {member.linkedinUrl && (
                <a 
                  href={member.linkedinUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-[10px] text-[#ccf063] hover:underline flex items-center gap-1 mt-1 font-mono uppercase tracking-wider"
                >
                  LinkedIn ↗
                </a>
              )}
            </div>
          ))}
        </div>
      </section>
    );
  };

  const renderDocumentLink = (label: string, fieldName: string, url: string | null | undefined) => {
    if (!url || url === "#") return null;
    
    if (isGated(fieldName)) {
      return (
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between text-xs">
          <span className="text-white/70 font-semibold">{label}</span>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
            Locked 🔒
          </span>
        </div>
      );
    }
    
    return (
      <a 
        href={url} 
        target="_blank" 
        rel="noreferrer" 
        onClick={trackDeckView}
        className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#ccf063]/30 rounded-xl p-3 flex items-center justify-between text-xs transition-all text-white group"
      >
        <span className="text-white/70 group-hover:text-[#ccf063] font-semibold transition-colors">{label}</span>
        <span className="text-[#ccf063] text-[10px] uppercase font-bold tracking-wider group-hover:underline">Open ↗</span>
      </a>
    );
  };

  return (
    <div className="font-sans space-y-6 text-white relative">
      {/* Header section */}
      <section className="border-b border-white/10 pb-6 relative">
        <div className="flex items-start justify-between pr-2">
          <div className="space-y-1">
            <h1 className="text-2xl font-serif text-white leading-tight">{startup.name}</h1>
            <p className="text-xs text-white/60 max-w-2xl">{startup.tagline}</p>
            
            {/* Social links */}
            <div className="flex flex-wrap gap-3 pt-2">
              {startup.websiteUrl && (
                <a href={startup.websiteUrl} target="_blank" rel="noreferrer" className="text-xs text-white/50 hover:text-[#ccf063] flex items-center gap-1 transition-colors">
                  <Globe className="w-3 h-3" />
                  Website
                </a>
              )}
              {startup.linkedinUrl && (
                <a href={startup.linkedinUrl} target="_blank" rel="noreferrer" className="text-xs text-white/50 hover:text-[#ccf063] flex items-center gap-1 transition-colors">
                  <Globe className="w-3 h-3 text-[#ccf063]" />
                  LinkedIn
                </a>
              )}
              {startup.twitterUrl && (
                <a href={startup.twitterUrl} target="_blank" rel="noreferrer" className="text-xs text-white/50 hover:text-[#ccf063] flex items-center gap-1 transition-colors">
                  <Globe className="w-3 h-3 text-sky-400" />
                  Twitter
                </a>
              )}
            </div>
          </div>
          {startup.logoUrl && (
            <img src={startup.logoUrl} alt={`${startup.name} logo`} className="w-14 h-14 rounded-xl object-cover bg-white/5 shrink-0" />
          )}
        </div>
        
        <div className="flex flex-wrap gap-2.5 mt-5">
          <div className="flex items-center gap-1.5 text-[10px] text-white/70 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
            <Briefcase className="w-3 h-3 text-[#ccf063]" />
            {startup.category || "Technology"}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-white/70 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
            <Target className="w-3 h-3 text-[#ccf063]" />
            {startup.stage || "Early Stage"}
          </div>
          {startup.location && (
            <div className="flex items-center gap-1.5 text-[10px] text-white/70 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
              <MapPin className="w-3 h-3 text-[#ccf063]" />
              {startup.location}
            </div>
          )}
          {startup.teamSize && (
            <div className="flex items-center gap-1.5 text-[10px] text-white/70 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
              <Users className="w-3 h-3 text-[#ccf063]" />
              {startup.teamSize} Team
            </div>
          )}
        </div>
      </section>

      {/* Profile Info */}
      <section className="space-y-3">
        <h3 className="text-xs font-bold text-white/80 uppercase tracking-wider">Company Profile</h3>
        <div className="grid grid-cols-2 gap-3 text-xs bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="space-y-1">
            <span className="text-white/50 block">Industry</span>
            {renderValue("industry", startup.industry)}
          </div>
          <div className="space-y-1">
            <span className="text-white/50 block">Sub-Industry</span>
            {renderValue("subIndustry", startup.subIndustry)}
          </div>
          <div className="space-y-1">
            <span className="text-white/50 block">Business Model</span>
            {renderValue("businessModel", startup.businessModel)}
          </div>
          <div className="space-y-1">
            <span className="text-white/50 block">HQ Location</span>
            <span className="text-white font-semibold">
              {[startup.city, startup.state, startup.country].filter(Boolean).join(", ") || startup.location || "N/A"}
            </span>
          </div>
        </div>
      </section>

      {/* Fundraising Details */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-white/80 uppercase tracking-wider flex items-center gap-1.5">
          <DollarSign className="w-4 h-4 text-[#ccf063]" />
          Fundraising Details
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-1">
            <p className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">Target Raise</p>
            <p className="font-bold text-base text-[#ccf063]">{startup.targetAmount || "N/A"}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-1">
            <p className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">Round Stage</p>
            <p className="font-bold text-base text-white">{startup.roundType || startup.stage || "N/A"}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-1">
            <p className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">Valuation / Cap</p>
            <p className="font-bold text-base text-white">
              {isGated("fixedValuation") ? (
                renderValue("fixedValuation", null)
              ) : (
                startup.valuation || startup.valuationCap || startup.fixedValuation || "N/A"
              )}
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-1">
            <p className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">Equity Offered</p>
            <p className="font-bold text-base text-white">{renderValue("equityOffered", startup.equityOffered)}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-1">
            <p className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">Min Ticket Size</p>
            <p className="font-bold text-base text-white">{renderValue("minTicket", startup.minTicket)}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-1">
            <p className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">Round Status</p>
            <p className="font-bold text-base text-white">{renderValue("roundStatus", startup.roundStatus)}</p>
          </div>
        </div>
      </section>

      {/* Financials & Market Metrics - Hidden for Pre-Seed */}
      {startup.stage !== "Pre-Seed" && (
        <>
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-white/80 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[#ccf063]" />
              Key Metrics & Traction
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-1">
                <p className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">Monthly Revenue</p>
                <p className="font-bold text-base text-white">{startup.monthlyRevenue || startup.arrMrr || "Pre-revenue"}</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-1">
                <p className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">Burn Rate</p>
                <p className="font-bold text-base text-white">
                  {isGated("burn") ? renderValue("burn", null) : (startup.monthlyBurn || startup.burnRate || "N/A")}
                </p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-1">
                <p className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">Runway</p>
                <p className="font-bold text-base text-white">{renderValue("runway", startup.runway)}</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-1">
                <p className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">Cash In Bank</p>
                <p className="font-bold text-base text-white">{renderValue("cashInBank", startup.cashInBank)}</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-1 col-span-2">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-[9px] text-white/50 uppercase tracking-wider">TAM</p>
                    <p className="font-bold text-white text-xs">{renderValue("tam", startup.tam)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-white/50 uppercase tracking-wider">SAM</p>
                    <p className="font-bold text-white text-xs">{renderValue("sam", startup.sam)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-white/50 uppercase tracking-wider">SOM</p>
                    <p className="font-bold text-white text-xs">{renderValue("som", startup.som)}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Customer & Audience traction */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-white/80 uppercase tracking-wider">Customers & traction</h3>
            <div className="grid grid-cols-2 gap-3 text-xs bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="space-y-1">
                <span className="text-white/50 block">Paying Customers</span>
                {renderValue("payingCustomers", startup.payingCustomers)}
              </div>
              <div className="text-space-y-1">
                <span className="text-white/50 block">Monthly Active Users</span>
                {renderValue("monthlyActiveUsers", startup.monthlyActiveUsers)}
              </div>
              <div className="space-y-1">
                <span className="text-white/50 block">Customer Geography</span>
                {renderValue("customerGeography", startup.customerGeography)}
              </div>
              <div className="space-y-1">
                <span className="text-white/50 block">Growth Rate</span>
                {renderValue("growthRate", startup.growthRate)}
              </div>
              <div className="space-y-1 col-span-2 pt-2 border-t border-white/10">
                <span className="text-white/50 block mb-1">Prior Notable Investors</span>
                {renderValue("priorNotableInvestors", startup.priorNotableInvestors)}
              </div>
            </div>
          </section>

          {/* Use of Funds */}
          {renderUseOfFunds()}

          {/* Pitch Summary */}
          <section className="space-y-5">
            <div>
              <h2 className="text-xs font-bold text-white/80 uppercase tracking-wider mb-2">The Problem</h2>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-white/70 leading-relaxed">
                {startup.problemText || "No problem statement provided."}
              </div>
            </div>
            <div>
              <h2 className="text-xs font-bold text-white/80 uppercase tracking-wider mb-2">The Solution</h2>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-white/70 leading-relaxed">
                {startup.solutionText || "No solution statement provided."}
              </div>
            </div>
          </section>
        </>
      )}

      {/* Pre-Seed Stage Custom Details */}
      {startup.stage === "Pre-Seed" && (
        <section className="space-y-5">
          {/* Concept & Validation Section */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-white/80 uppercase tracking-wider flex items-center gap-1.5 border-b border-white/10 pb-2">
              Concept & Market Validation
            </h2>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-1">
                <p className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">Idea Stage</p>
                <p className="font-bold text-sm text-white">{startup.ideaStage || "N/A"}</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-1">
                <p className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">Validation Method</p>
                <p className="font-bold text-sm text-[#ccf063]">{startup.validationActivity || "N/A"}</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-1">
                <p className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">Tech Stack</p>
                <p className="font-bold text-sm text-white truncate">{startup.techStack || "N/A"}</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-1">
                <p className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">Demo Sandbox</p>
                {startup.demoLink ? (
                  <a href={startup.demoLink} target="_blank" rel="noreferrer" className="text-xs text-[#ccf063] hover:underline flex items-center gap-0.5 mt-0.5 truncate font-semibold">
                    Open Demo Link ↗
                  </a>
                ) : (
                  <p className="text-xs text-white/40 mt-0.5">N/A</p>
                )}
              </div>
            </div>
          </div>

          {/* Validation Details Statement */}
          <div className="space-y-1 bg-white/5 border border-white/10 rounded-xl p-4 text-xs">
            <span className="text-white/50 block font-bold uppercase tracking-wider mb-2">Validation Detail & Signals</span>
            <p className="text-white/70 leading-relaxed whitespace-pre-wrap">{startup.validationDetail || "No validation detail reported."}</p>
            {startup.willingnessToPaySignal && (
              <div className="mt-3 pt-3 border-t border-white/5">
                <span className="text-white/50 block font-bold uppercase tracking-wider mb-1">Willingness to Pay Signal</span>
                <p className="text-[#ccf063] font-semibold">{startup.willingnessToPaySignal}</p>
              </div>
            )}
          </div>

          {/* Core Idea Narrative */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold text-white/80 uppercase tracking-wider mb-2">Core Problem</h3>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-white/70 leading-relaxed whitespace-pre-wrap">
                {startup.coreProblem || "No problem statement provided."}
              </div>
            </div>
            <div>
              <h3 className="text-xs font-bold text-white/80 uppercase tracking-wider mb-2">Proposed Solution</h3>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-white/70 leading-relaxed whitespace-pre-wrap">
                {startup.proposedSolution || "No solution statement provided."}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-xs">
                <h4 className="font-bold text-white/80 uppercase tracking-wider mb-1">Why Now?</h4>
                <p className="text-white/70 leading-relaxed">{startup.whyNow || "N/A"}</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-xs">
                <h4 className="font-bold text-white/80 uppercase tracking-wider mb-1">Unique Insight</h4>
                <p className="text-white/70 leading-relaxed">{startup.uniqueInsight || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Execution & Approach Details */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold text-white/80 uppercase tracking-wider mb-2">Technical Approach & Architecture</h3>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-white/70 leading-relaxed whitespace-pre-wrap">
                {startup.technicalApproach || "No technical approach details provided."}
              </div>
            </div>
            <div>
              <h3 className="text-xs font-bold text-white/80 uppercase tracking-wider mb-2">Founder-Market Fit (Why Us?)</h3>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-white/70 leading-relaxed whitespace-pre-wrap">
                {startup.whyThisTeam || "No details provided."}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-xs">
                <h4 className="font-bold text-white/80 uppercase tracking-wider mb-1">Milestone (Next 6-12m)</h4>
                <p className="text-white/70 leading-relaxed font-semibold">{startup.keyMilestone || "N/A"}</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-xs">
                <h4 className="font-bold text-white/80 uppercase tracking-wider mb-1">Long-term Vision</h4>
                <p className="text-white/70 leading-relaxed">{startup.vision || "N/A"}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-xs">
                <h4 className="font-bold text-white/80 uppercase tracking-wider mb-1">Differentiation</h4>
                <p className="text-white/70 leading-relaxed">{startup.differentiation || "N/A"}</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-xs">
                <h4 className="font-bold text-white/80 uppercase tracking-wider mb-1">IP Assets</h4>
                <p className="text-white/70 leading-relaxed">{startup.ipAssets || "N/A"}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Team Roster */}
      {renderTeamRoster()}

      {/* Attachments */}
      <section className="space-y-3">
        <h3 className="text-xs font-bold text-white/80 uppercase tracking-wider flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-[#ccf063]" />
          Documents & Attachments
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {renderDocumentLink("One Pager / Summary", "onePager", startup.onePagerUrl)}
          {renderDocumentLink("Business Plan", "businessPlan", startup.businessPlanUrl)}
          {renderDocumentLink("Financial Model", "financialModel", startup.financialModelUrl)}
        </div>
      </section>

      {/* Pitch Deck */}
      {startup.pitchDeckUrl && startup.pitchDeckUrl !== "#" && !isGated("pitchDeck") && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-white/80 uppercase tracking-wider">
              Pitch Deck
            </h2>
            <a 
              href={startup.pitchDeckUrl} 
              target="_blank" 
              rel="noreferrer" 
              onClick={trackDeckView}
              className="text-[10px] text-[#ccf063] hover:underline flex items-center gap-1"
            >
              Open in new tab
            </a>
          </div>
          <div className="w-full aspect-video border border-white/10 rounded-xl overflow-hidden bg-black/40">
            <iframe src={startup.pitchDeckUrl} className="w-full h-full border-0" />
          </div>
        </section>
      )}

      {/* Gated Pitch Deck State */}
      {startup.pitchDeckUrl && startup.pitchDeckUrl !== "#" && isGated("pitchDeck") && (
        <section className="space-y-3">
          <h2 className="text-xs font-bold text-white/80 uppercase tracking-wider">
            Pitch Deck
          </h2>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center text-xs flex flex-col items-center gap-2">
            <Lock className="w-6 h-6 text-red-400" />
            <p className="text-white/60">The Pitch Deck is Gated. Request a deal intro to view full decks.</p>
          </div>
        </section>
      )}
    </div>
  );
}

export interface RequestDealButtonProps {
  startup: any;
  userEmail: string | null;
}

export function RequestDealButton({ startup, userEmail }: RequestDealButtonProps) {
  const [dealStatus, setDealStatus] = useState<string | null>(startup?.interactionState || null);
  const [loadingDeal, setLoadingDeal] = useState(false);

  useEffect(() => {
    setDealStatus(startup?.interactionState || null);
  }, [startup?.id, startup?.interactionState]);

  if (!startup) return null;

  const handleRequestDeal = async () => {
    if (dealStatus) return;
    setLoadingDeal(true);
    try {
      const res = await fetch("/api/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startupId: startup.id, action: "request_intro", investorEmail: userEmail }),
      });
      const json = (await res.json()) as any;
      if (json.success) {
        setDealStatus("INTRO_REQUESTED");
      }
    } catch (e) {
      console.error("Failed to request deal:", e);
    } finally {
      setLoadingDeal(false);
    }
  };

  return (
    <div className="w-full">
      {dealStatus === "INTRO_REQUESTED" ? (
        <button 
          disabled 
          className="w-full bg-[#ccf063]/15 border border-[#ccf063]/30 text-[#ccf063] font-bold uppercase py-3.5 px-6 rounded-2xl cursor-not-allowed text-center text-xs flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-[#ccf063]" />
          Deal Request Sent
        </button>
      ) : dealStatus === "MUTUAL_MATCH" ? (
        <button 
          disabled 
          className="w-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold uppercase py-3.5 px-6 rounded-2xl cursor-not-allowed text-center text-xs flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          Mutual Deal Match 🤝
        </button>
      ) : dealStatus === "PASSED" ? (
        <button 
          disabled 
          className="w-full bg-red-500/15 border border-red-500/30 text-red-400 font-bold uppercase py-3.5 px-6 rounded-2xl cursor-not-allowed text-center text-xs"
        >
          Deal Passed
        </button>
      ) : (
        <button
          onClick={handleRequestDeal}
          disabled={loadingDeal}
          className="w-full bg-[#ccf063] hover:bg-[#ccf063]/90 text-black font-extrabold uppercase py-3.5 px-6 rounded-2xl transition-all shadow-md shadow-[#ccf063]/15 active:scale-[0.98] cursor-pointer text-center text-xs flex items-center justify-center gap-2 hover:scale-[1.01] hover:shadow-[#ccf063]/25"
        >
          {loadingDeal ? (
            <>
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              Sending Request...
            </>
          ) : (
            "Request for Deal 🚀"
          )}
        </button>
      )}
    </div>
  );
}
