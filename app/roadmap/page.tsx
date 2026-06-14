// app/roadmap/page.tsx
"use client";
import React, { useState } from "react";
import ProjectGuard from "@/components/ProjectGuard";
import DashboardLayout from "@/components/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import { useProjectStore } from "@/store/useProjectStore";
import { MOCK_ROADMAP_REPORT } from "@/lib/graph/roadmap/examples";
import { TimelineAlignmentEngine } from "@/lib/graph/roadmap/engines";
import { 
  Calendar, 
  Target, 
  Users, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  Briefcase, 
  DollarSign, 
  Layers, 
  Zap,
  Activity
} from "lucide-react";

export default function RoadmapPage() {
  const { projects, activeId } = useProjectStore();
  const activeProject = projects.find((p) => p.id === activeId);

  const roadmap = activeProject?.roadmapIntel || MOCK_ROADMAP_REPORT;
  const [activeTab, setActiveTab] = useState<"timeline" | "priority" | "blueprints" | "resources">("timeline");

  // Map milestones to 5-Phase Timeline
  const TIMELINE_PHASES = [
    { phase: "Phase 1", title: "Validation & Discovery", duration: "Months 1–3", color: "#daf264" },
    { phase: "Phase 2", title: "MVP & Pilot Operations", duration: "Months 4–9", color: "#c8e84a" },
    { phase: "Phase 3", title: "Commercial Growth", duration: "Months 10–18", color: "#7ab010" },
    { phase: "Phase 4", title: "Fundraising Mobilization", duration: "Months 16–20", color: "#4a7a00" },
    { phase: "Phase 5", title: "Scaling & Expansion", duration: "Month 21+", color: "#2a5a00" }
  ];

  const mappedPhases = TIMELINE_PHASES.map((ph, idx) => {
    const phaseMilestones = (Array.isArray(roadmap?.milestones) ? roadmap.milestones : []).filter((ms: any) => {
      if (!ms || typeof ms !== 'object') return false;
      const mIdx = TimelineAlignmentEngine.getTimelineIndex(ms.timeline);
      return mIdx === idx;
    });

    // Determine KPIs for this phase dynamically
    let kpis: string[] = [];
    if (idx === 0) {
      kpis = (Array.isArray(roadmap?.validationRoadmap) ? roadmap.validationRoadmap : []).slice(0, 3).map((v: any) => v?.successMetric || "").filter(Boolean);
      if (kpis.length === 0) kpis = ["30 Interviews Completed", "Willingness to Pay verified"];
    } else if (idx === 1) {
      kpis = ["MVP Dashboard Live", "5 Pilot Projects Running", "Peak Load Decreased >20%"];
    } else if (idx === 2) {
      kpis = ["50 Paid B2B SaaS Accounts", "OCPP Network Integrations", "₹3 Lakhs MRR Achieved"];
    } else if (idx === 3) {
      kpis = ["Investor Pitch Deck Verified", "SISFS Grant Secured", "Seed Capital In Bank"];
    } else {
      kpis = ["Multi-City Onboarding", "National SaaS Marketplace", "International Expansion Study"];
    }

    return {
      ...ph,
      status: idx === 0 ? "active" : "upcoming",
      milestones: phaseMilestones.map((ms: any, mIdx: number) => ({
        task: ms.goal || "Milestone goal",
        criteria: ms.successCriteria || "Success criteria",
        dependencies: Array.isArray(ms.dependencies) ? ms.dependencies : [],
        priority: ms.priority || "MEDIUM",
        // Mark first validation milestone as done to show active execution status
        done: idx === 0 && mIdx === 0
      })),
      kpis
    };
  });

  // Sort hiring roadmap by priority
  const sortedHiring = [...(Array.isArray(roadmap?.hiringRoadmap) ? roadmap.hiringRoadmap : [])].sort((a: any, b: any) => (a?.priority || 0) - (b?.priority || 0));

  return (
    <ProjectGuard>
      <DashboardLayout>
        <div className="p-8 space-y-8 min-h-screen text-white">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-300 to-gray-500 bg-clip-text text-transparent">
                Founder Roadmap & Execution Intelligence
              </h1>
              <p className="text-sm mt-1" style={{ color: "var(--muted-fg)" }}>
                Tactical execution sequences derived from VentureIQ intelligence
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--card-border)] bg-[rgba(218,242,100,0.02)]">
              <Activity className="w-4 h-4 text-[var(--accent)] animate-pulse" />
              <span className="text-xs font-semibold text-gray-300">
                Active Project: {activeProject?.name || "Pune EV Charging"}
              </span>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-2xl p-5 border border-[var(--card-border)] bg-[var(--card-bg)] hover:border-[rgba(218,242,100,0.2)] transition-all">
              <div className="flex justify-between items-start">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Milestones</span>
                <Layers className="w-5 h-5 text-[var(--accent)]" />
              </div>
              <p className="text-2xl font-bold mt-2">{(roadmap.milestones || []).length}</p>
              <p className="text-xs text-gray-500 mt-1">Programmatically linked sequences</p>
            </div>

            <div className="rounded-2xl p-5 border border-[var(--card-border)] bg-[var(--card-bg)] hover:border-[rgba(218,242,100,0.2)] transition-all">
              <div className="flex justify-between items-start">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Critical Path</span>
                <Target className="w-5 h-5 text-red-400" />
              </div>
              <p className="text-2xl font-bold mt-2">
                {(roadmap.milestones || []).filter((m: any) => m.priority === "HIGH").length}
              </p>
              <p className="text-xs text-gray-500 mt-1">High-priority deliverables</p>
            </div>

            <div className="rounded-2xl p-5 border border-[var(--card-border)] bg-[var(--card-bg)] hover:border-[rgba(218,242,100,0.2)] transition-all">
              <div className="flex justify-between items-start">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Initial Runway</span>
                <DollarSign className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold mt-2">₹2 Lakhs</p>
              <p className="text-xs text-emerald-500 mt-1">Validation stage budget cap</p>
            </div>

            <div className="rounded-2xl p-5 border border-[var(--card-border)] bg-[var(--card-bg)] hover:border-[rgba(218,242,100,0.2)] transition-all">
              <div className="flex justify-between items-start">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Target Hires</span>
                <Users className="w-5 h-5 text-indigo-400" />
              </div>
              <p className="text-2xl font-bold mt-2">{(roadmap.hiringRoadmap || []).length}</p>
              <p className="text-xs text-gray-500 mt-1">Structured priority order</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-[var(--card-border)] pb-px gap-6 text-sm">
            {(
              [
                { id: "timeline", label: "5-Phase Timeline", icon: Calendar },
                { id: "priority", label: "Priority Matrix", icon: Zap },
                { id: "blueprints", label: "Discovery & GTM", icon: TrendingUp },
                { id: "resources", label: "Hiring & Funding", icon: Users },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="relative pb-4 flex items-center gap-2 font-medium transition-colors"
                  style={{ color: isActive ? "var(--accent)" : "var(--muted-fg)" }}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {isActive && (
                    <motion.div
                      layoutId="roadmap-tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent)]"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Content Area */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              
              {/* TAB 1: 5-Phase Action Timeline */}
              {activeTab === "timeline" && (
                <div className="space-y-8">
                  
                  {/* Short Term Action Plans */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="rounded-2xl p-6 border border-[var(--card-border)] bg-[rgba(255,255,255,0.01)]">
                      <div className="flex items-center gap-2 mb-3">
                        <Clock className="w-4 h-4 text-[var(--accent)]" />
                        <h3 className="font-bold text-white">30-Day Validation Plan</h3>
                      </div>
                      <ul className="space-y-3">
                        {(Array.isArray(roadmap["30DayPlan"]) ? roadmap["30DayPlan"] : []).map((plan: string, i: number) => (
                          <li key={i} className="text-xs text-gray-400 leading-relaxed flex items-start gap-2">
                            <span className="text-[var(--accent)] mt-0.5">•</span>
                            <span>{plan}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-2xl p-6 border border-[var(--card-border)] bg-[rgba(255,255,255,0.01)]">
                      <div className="flex items-center gap-2 mb-3">
                        <Clock className="w-4 h-4 text-emerald-400" />
                        <h3 className="font-bold text-white">90-Day MVP & Pilot Plan</h3>
                      </div>
                      <ul className="space-y-3">
                        {(Array.isArray(roadmap["90DayPlan"]) ? roadmap["90DayPlan"] : []).map((plan: string, i: number) => (
                          <li key={i} className="text-xs text-gray-400 leading-relaxed flex items-start gap-2">
                            <span className="text-emerald-400 mt-0.5">•</span>
                            <span>{plan}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-2xl p-6 border border-[var(--card-border)] bg-[rgba(255,255,255,0.01)]">
                      <div className="flex items-center gap-2 mb-3">
                        <Clock className="w-4 h-4 text-indigo-400" />
                        <h3 className="font-bold text-white">1-Year Scaling Plan</h3>
                      </div>
                      <ul className="space-y-3">
                        {(Array.isArray(roadmap["1YearPlan"]) ? roadmap["1YearPlan"] : []).map((plan: string, i: number) => (
                          <li key={i} className="text-xs text-gray-400 leading-relaxed flex items-start gap-2">
                            <span className="text-indigo-400 mt-0.5">•</span>
                            <span>{plan}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Connected Timeline */}
                  <div className="relative pl-6 md:pl-0 mt-8">
                    {/* Vertical Connecting line */}
                    <div className="absolute left-6 md:left-8 top-10 bottom-10 w-px bg-gradient-to-b from-[var(--accent)] via-emerald-600 to-indigo-800" />

                    <div className="space-y-8">
                      {mappedPhases.map((p, idx) => (
                        <div key={p.phase} className="relative flex flex-col md:flex-row gap-6 md:gap-10">
                          
                          {/* Dot Icon */}
                          <div className="absolute left-0 md:left-8 top-1.5 -translate-x-1/2 w-10 h-10 rounded-full flex items-center justify-center border-2 z-10"
                            style={{
                              background: p.status === "active" ? "var(--accent)" : "#0c0c0c",
                              borderColor: p.color,
                              color: p.status === "active" ? "#0a0a0a" : p.color,
                              boxShadow: p.status === "active" ? `0 0 15px ${p.color}40` : "none"
                            }}>
                            <span className="text-xs font-black">{idx + 1}</span>
                          </div>

                          {/* Content Card */}
                          <div className="flex-1 ml-6 md:ml-16 rounded-2xl p-6 border transition-all"
                            style={{
                              background: p.status === "active" ? "rgba(218, 242, 100, 0.02)" : "var(--card-bg)",
                              borderColor: p.status === "active" ? "rgba(218, 242, 100, 0.2)" : "var(--card-border)"
                            }}>
                            
                            {/* Phase Metadata */}
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-4 pb-3 border-b border-[var(--card-border)]">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: p.color }}>{p.phase}</span>
                                  {p.status === "active" && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[rgba(218,242,100,0.1)] text-[var(--accent)] border border-[rgba(218,242,100,0.2)]">
                                      ACTIVE TASK AREA
                                    </span>
                                  )}
                                </div>
                                <h3 className="text-lg font-bold text-white mt-0.5">{p.title}</h3>
                              </div>
                              <span className="text-xs px-3 py-1 rounded-full border border-[var(--card-border)] bg-gray-900 text-gray-400 font-mono">
                                {p.duration}
                              </span>
                            </div>

                            {/* Milestones & Success Criteria */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Milestone Deliverables</h4>
                                {p.milestones.length === 0 ? (
                                  <p className="text-xs text-gray-500 italic">No milestones currently computed for this phase.</p>
                                ) : (
                                  <ul className="space-y-3">
                                    {p.milestones.map((m: any, mIdx: number) => (
                                      <li key={mIdx} className="space-y-1">
                                        <div className="flex items-start gap-2.5">
                                          <span className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold border"
                                            style={{
                                              background: m.done ? `${p.color}20` : "transparent",
                                              borderColor: m.done ? p.color : "gray",
                                              color: m.done ? p.color : "gray"
                                            }}>
                                            {m.done ? "✓" : " "}
                                          </span>
                                          <div>
                                            <p className="text-xs font-semibold" style={{ color: m.done ? "white" : "gray" }}>
                                              {m.task}
                                            </p>
                                            <p className="text-[10px] text-gray-500 italic mt-0.5">
                                              Success: {m.criteria}
                                            </p>
                                            {m.dependencies.length > 0 && (
                                              <p className="text-[9px] text-amber-500 mt-1 flex items-center gap-1">
                                                <span>Prerequisites:</span>
                                                {m.dependencies.map((d: string) => (
                                                  <span key={d} className="px-1.5 py-0.5 rounded bg-amber-955/40 border border-amber-900/30 text-amber-400">{d}</span>
                                                ))}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>

                              {/* KPIs */}
                              <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Success KPIs</h4>
                                <div className="flex flex-wrap gap-2">
                                  {p.kpis.map((kpi, kIdx) => (
                                    <span key={kIdx} className="text-xs px-3 py-1.5 rounded-xl border font-medium flex items-center gap-1.5"
                                      style={{
                                        background: `${p.color}05`,
                                        borderColor: `${p.color}20`,
                                        color: p.color
                                      }}>
                                      <Target className="w-3.5 h-3.5" />
                                      {kpi}
                                    </span>
                                  ))}
                                </div>
                              </div>

                            </div>

                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 2: 2x2 Priority Matrix */}
              {activeTab === "priority" && (
                <div className="space-y-6">
                  
                  <div className="rounded-2xl p-6 border border-[var(--card-border)] bg-[var(--card-bg)]">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <Zap className="w-5 h-5 text-[var(--accent)]" />
                      Programmatic Task Priority Matrix
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">
                      Action items classified programmatically into Impact vs Effort quadrants
                    </p>
                  </div>

                  {/* 2x2 Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Quadrant 1: High Impact, Low Effort */}
                    <div className="rounded-2xl p-6 border border-emerald-900/40 bg-emerald-950/10 space-y-4 hover:border-emerald-500/30 transition-all">
                      <div className="flex justify-between items-center pb-2 border-b border-emerald-900/30">
                        <span className="text-xs font-black uppercase tracking-widest text-emerald-400">Quick Wins</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">HIGH IMPACT · LOW EFFORT</span>
                      </div>
                      <ul className="space-y-2.5">
                        {(Array.isArray(roadmap.priorityMatrix?.highImpactLowEffort) ? roadmap.priorityMatrix.highImpactLowEffort : []).map((task: string, i: number) => (
                          <li key={i} className="text-xs text-gray-300 leading-relaxed flex items-start gap-2">
                            <span className="text-emerald-400 mt-0.5">✓</span>
                            <span>{task}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Quadrant 2: High Impact, High Effort */}
                    <div className="rounded-2xl p-6 border border-cyan-900/40 bg-cyan-950/10 space-y-4 hover:border-cyan-500/30 transition-all">
                      <div className="flex justify-between items-center pb-2 border-b border-cyan-900/30">
                        <span className="text-xs font-black uppercase tracking-widest text-cyan-400">Strategic Projects</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">HIGH IMPACT · HIGH EFFORT</span>
                      </div>
                      <ul className="space-y-2.5">
                        {(Array.isArray(roadmap.priorityMatrix?.highImpactHighEffort) ? roadmap.priorityMatrix.highImpactHighEffort : []).map((task: string, i: number) => (
                          <li key={i} className="text-xs text-gray-300 leading-relaxed flex items-start gap-2">
                            <span className="text-cyan-400 mt-0.5">★</span>
                            <span>{task}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Quadrant 3: Low Impact, Low Effort */}
                    <div className="rounded-2xl p-6 border border-gray-800 bg-gray-900/10 space-y-4 hover:border-gray-700 transition-all">
                      <div className="flex justify-between items-center pb-2 border-b border-gray-800">
                        <span className="text-xs font-black uppercase tracking-widest text-gray-400">Fill-ins</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-gray-800 text-gray-400 font-bold">LOW IMPACT · LOW EFFORT</span>
                      </div>
                      <ul className="space-y-2.5">
                        {(Array.isArray(roadmap.priorityMatrix?.lowImpactLowEffort) ? roadmap.priorityMatrix.lowImpactLowEffort : []).map((task: string, i: number) => (
                          <li key={i} className="text-xs text-gray-400 leading-relaxed flex items-start gap-2">
                            <span className="text-gray-500 mt-0.5">•</span>
                            <span>{task}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Quadrant 4: Low Impact, High Effort */}
                    <div className="rounded-2xl p-6 border border-amber-900/40 bg-amber-950/10 space-y-4 hover:border-amber-500/30 transition-all">
                      <div className="flex justify-between items-center pb-2 border-b border-amber-900/30">
                        <span className="text-xs font-black uppercase tracking-widest text-amber-400">Major Time Sinks</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">LOW IMPACT · HIGH EFFORT</span>
                      </div>
                      <ul className="space-y-2.5">
                        {(Array.isArray(roadmap.priorityMatrix?.lowImpactHighEffort) ? roadmap.priorityMatrix.lowImpactHighEffort : []).map((task: string, i: number) => (
                          <li key={i} className="text-xs text-gray-300 leading-relaxed flex items-start gap-2">
                            <span className="text-amber-500 mt-0.5">!</span>
                            <span className="text-gray-400">{task}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                  </div>

                </div>
              )}

              {/* TAB 3: Discovery & GTM */}
              {activeTab === "blueprints" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  
                  {/* Validation Tests */}
                  <div className="rounded-2xl p-6 border border-[var(--card-border)] bg-[var(--card-bg)] space-y-6">
                    <div>
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-[var(--accent)]" />
                        Customer Validation Experiments
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Testing core riskiest assumptions prior to engineering sprint
                      </p>
                    </div>

                    <div className="space-y-4">
                      {(roadmap.validationRoadmap || []).map((test: any, i: number) => (
                        <div key={i} className="rounded-xl p-4 border border-[var(--card-border)] bg-black/20 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-xs px-2.5 py-0.5 rounded-full font-mono uppercase bg-gray-900 text-gray-400 border border-[var(--card-border)]">
                              {(test.type || "").replace("_", " ")}
                            </span>
                            <span className="text-xs font-black text-gray-500">EXP #{i+1}</span>
                          </div>
                          <p className="text-xs text-white font-semibold leading-relaxed">
                            {test.task}
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-[var(--card-border)] text-[10px]">
                            <div>
                              <span className="font-bold text-emerald-400 block mb-0.5">✓ Success Metric</span>
                              <p className="text-gray-400 leading-normal">{test.successMetric}</p>
                            </div>
                            <div>
                              <span className="font-bold text-red-400 block mb-0.5">✕ Failure Criteria</span>
                              <p className="text-gray-400 leading-normal">{test.failureCriteria}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Go to Market Plan */}
                  <div className="space-y-6">
                    
                    {/* GTM card */}
                    <div className="rounded-2xl p-6 border border-[var(--card-border)] bg-[var(--card-bg)] space-y-4">
                      <div>
                        <h3 className="text-lg font-bold flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-[var(--accent)]" />
                          Go-To-Market & Distribution
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                          How the startup builds initial pipeline and lands clients
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <span className="text-xs font-bold text-gray-400 block">Acquisition Strategy</span>
                          <p className="text-xs text-gray-300 leading-relaxed mt-1">
                            {roadmap.goToMarketPlan?.customerAcquisitionStrategy}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <div>
                            <span className="text-xs font-bold text-gray-400 block">Channels</span>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {(roadmap.goToMarketPlan?.channels || []).map((ch: string) => (
                                <span key={ch} className="text-[10px] px-2 py-0.5 rounded bg-gray-900 border border-[var(--card-border)] text-gray-300">
                                  {ch}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <span className="text-xs font-bold text-gray-400 block">Partnerships</span>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {(roadmap.goToMarketPlan?.partnerships || []).map((pt: string) => (
                                <span key={pt} className="text-[10px] px-2 py-0.5 rounded bg-gray-900 border border-[var(--card-border)] text-gray-300">
                                  {pt}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Key Success Factors */}
                    <div className="rounded-2xl p-6 border border-[var(--card-border)] bg-[var(--card-bg)] space-y-4">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">
                        Venture Critical Success Factors
                      </h3>
                      <ul className="space-y-2">
                        {(roadmap.keySuccessFactors || []).map((factor: string, i: number) => (
                          <li key={i} className="text-xs text-gray-300 leading-relaxed flex items-start gap-2">
                            <span className="w-5 h-5 rounded-full bg-[rgba(218,242,100,0.1)] text-[var(--accent)] font-bold flex items-center justify-center flex-shrink-0 text-[10px] mt-0.5">
                              {i + 1}
                            </span>
                            <span>{factor}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                  </div>

                </div>
              )}

              {/* TAB 4: Hiring & Funding */}
              {activeTab === "resources" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* Hiring Sequence */}
                  <div className="rounded-2xl p-6 border border-[var(--card-border)] bg-[var(--card-bg)] lg:col-span-2 space-y-6">
                    <div>
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-[var(--accent)]" />
                        Hiring Roadmap & Sequence
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Roles sorted programmatically by chronological priority and department
                      </p>
                    </div>

                    <div className="space-y-4">
                      {sortedHiring.map((role: any) => (
                        <div key={role.role} className="flex gap-4 items-start p-4 rounded-xl border border-[var(--card-border)] bg-black/10 hover:border-indigo-500/20 transition-all">
                          <div className="w-8 h-8 rounded-full bg-indigo-950 border border-indigo-800 text-indigo-400 flex items-center justify-center flex-shrink-0 text-xs font-black">
                            #{role.priority}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex justify-between items-start">
                              <h4 className="text-xs font-bold text-white">{role.role}</h4>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-gray-900 border border-[var(--card-border)] text-gray-400 font-semibold">
                                {role.department}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 leading-relaxed">{role.justification}</p>
                            <p className="text-[10px] text-indigo-400 font-mono mt-1.5 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Target Onboarding: {role.timeline}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Fundraising Pipeline */}
                  <div className="rounded-2xl p-6 border border-[var(--card-border)] bg-[var(--card-bg)] lg:col-span-1 space-y-6">
                    <div>
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-[var(--accent)]" />
                        Fundraising Milestones
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Capital requirements mapped across progression stages
                      </p>
                    </div>

                    <div className="space-y-5">
                      
                      {/* Stage 1: Bootstrap */}
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-gray-400 block border-b border-[var(--card-border)] pb-1">
                          1. Bootstrap Stage
                        </span>
                        <ul className="space-y-1">
                          {(roadmap.fundraisingRoadmap?.bootstrapStage || []).map((item: string, i: number) => (
                            <li key={i} className="text-[11px] text-gray-300 leading-relaxed flex items-start gap-1.5">
                              <span className="text-gray-500 mt-0.5">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Stage 2: Grants */}
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-emerald-400 block border-b border-[var(--card-border)] pb-1">
                          2. Grant Options (Non-Dilutive)
                        </span>
                        <ul className="space-y-1">
                          {(roadmap.fundraisingRoadmap?.grantStage || []).map((item: string, i: number) => (
                            <li key={i} className="text-[11px] text-gray-300 leading-relaxed flex items-start gap-1.5">
                              <span className="text-emerald-500 mt-0.5">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Stage 3: Angel */}
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-cyan-400 block border-b border-[var(--card-border)] pb-1">
                          3. Angel Stage
                        </span>
                        <ul className="space-y-1">
                          {(roadmap.fundraisingRoadmap?.angelStage || []).map((item: string, i: number) => (
                            <li key={i} className="text-[11px] text-gray-300 leading-relaxed flex items-start gap-1.5">
                              <span className="text-cyan-500 mt-0.5">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Stage 4: Seed */}
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-indigo-400 block border-b border-[var(--card-border)] pb-1">
                          4. Venture Seed Capital
                        </span>
                        <ul className="space-y-1">
                          {(roadmap.fundraisingRoadmap?.seedStage || []).map((item: string, i: number) => (
                            <li key={i} className="text-[11px] text-gray-300 leading-relaxed flex items-start gap-1.5">
                              <span className="text-indigo-500 mt-0.5">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                    </div>
                  </div>

                </div>
              )}

            </motion.div>
          </AnimatePresence>

        </div>
      </DashboardLayout>
    </ProjectGuard>
  );
}
