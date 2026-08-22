"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { diligenceWorkerPlan } from "@/lib/intelligence/contracts";

interface StartupOption {
  id: string;
  name: string;
  tagline: string;
  category: string;
  stage: string;
  founder: string;
  targetAmount: string;
  raisedAmount: string;
  traction: string;
  pitchDeckUrl: string;
}

interface DiligenceRun {
  id: string;
  status: string;
  runtimeVersion: string;
  createdAt: string;
  inputSnapshot: {
    missingFields: string[];
    availableDocumentCount: number;
  };
  _count: {
    evidence: number;
    findings: number;
    scorecards: number;
    recommendations: number;
  };
  findings: Array<{
    id: string;
    title: string;
    content: string;
    status: "SUPPORTED" | "INSUFFICIENT_EVIDENCE" | "NEEDS_REVIEW" | "CONFLICTING_EVIDENCE";
    confidence: number | null;
  }>;
  scorecards: Array<{
    id: string;
    framework: string;
    totalScore: number | null;
    explanation: string | null;
    components: Record<string, number>;
  }>;
  recommendations: Array<{
    id: string;
    type: string;
    title: string;
    rationale: string;
    priority: number;
  }>;
  sharedState?: {
    executionPlan?: Array<{ id: string; status: string }>;
  };
}

const statusCopy: Record<string, string> = {
  AWAITING_EVIDENCE: "More input is required before scoring can begin.",
  QUEUED: "Input package is ready for the next analysis phase.",
  DRAFT: "Run has been created but not yet prepared.",
  RUNNING: "Analysis workers are running.",
  VERIFYING: "Results are being checked against evidence.",
  COMPLETED: "Verified analysis is ready.",
  FAILED: "The run needs attention before it can continue.",
  CANCELLED: "This run was cancelled.",
};

export interface DiligenceDetailsProps {
  initialStartupId?: string;
  hideHeader?: boolean;
}

export function DiligenceDetails({ initialStartupId, hideHeader }: DiligenceDetailsProps) {
  const [startups, setStartups] = useState<StartupOption[]>([]);
  const [selectedId, setSelectedId] = useState(initialStartupId || "");
  const [latestRun, setLatestRun] = useState<DiligenceRun | null>(null);
  const [loadingStartups, setLoadingStartups] = useState(true);
  const [loadingRun, setLoadingRun] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState("");
  const [streamingState, setStreamingState] = useState<Record<string, string>>({});
  const [scenarioOverrides, setScenarioOverrides] = useState<{ monthlyRevenue?: string, monthlyBurn?: string }>({});

  const selectedStartup = useMemo(
    () => startups.find((startup) => startup.id === selectedId) ?? null,
    [selectedId, startups]
  );

  useEffect(() => {
    const loadStartups = async () => {
      try {
        const response = await fetch("/api/startups");
        const payload = (await response.json()) as any;
        if (!response.ok || !payload.success) throw new Error(payload.error || "Unable to load startups.");

        const data = payload.data as StartupOption[];
        setStartups(data);
        if (!initialStartupId) {
           setSelectedId(data[0]?.id || "");
        }
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "Unable to load startups.");
      } finally {
        setLoadingStartups(false);
      }
    };

    loadStartups();
  }, [initialStartupId]);

  useEffect(() => {
    if (initialStartupId && initialStartupId !== selectedId) {
      setSelectedId(initialStartupId);
    }
  }, [initialStartupId]);

  useEffect(() => {
    if (!selectedId) {
      return;
    }

    const loadLatestRun = async () => {
      setLoadingRun(true);
      try {
        const response = await fetch(`/api/investor/analyses?startupId=${encodeURIComponent(selectedId)}`);
        const payload = (await response.json()) as any;
        if (response.ok && payload.success) {
          setLatestRun(payload.data[0] ?? null);
        } else if (response.status === 401) {
          setLatestRun(null);
        } else {
          throw new Error(payload.error || "Unable to load previous runs.");
        }
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "Unable to load previous runs.");
      } finally {
        setLoadingRun(false);
      }
    };

    loadLatestRun();
  }, [selectedId]);

  const prepareDiligence = async () => {
    if (!selectedStartup) return;
    setPreparing(true);
    setError("");

    try {
      const response = await fetch("/api/investor/analyses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startupId: selectedStartup.id }),
      });
      const payload = (await response.json()) as any;
      if (!response.ok || !payload.success) throw new Error(payload.error || "Unable to prepare diligence.");
      setLatestRun(payload.data);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to prepare diligence.");
    } finally {
      setPreparing(false);
    }
  };

  const executeFoundationalAnalysis = async () => {
    if (!latestRun) return;
    setExecuting(true);
    setError("");
    setStreamingState({});

    try {
      const response = await fetch(`/api/investor/analyses/${latestRun.id}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioOverrides }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as any;
        throw new Error(payload.error || "Unable to execute foundational diligence.");
      }

      let isDone = false;
      while (!isDone) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const pollResponse = await fetch(`/api/investor/analyses?startupId=${encodeURIComponent(selectedId)}`);
        const pollPayload = (await pollResponse.json()) as any;
        
        if (pollResponse.ok && pollPayload.success && pollPayload.data[0]) {
          const run = pollPayload.data[0];
          setLatestRun(run);
          
          if (run.sharedState?.executionPlan) {
            const state: Record<string, string> = {};
            run.sharedState.executionPlan.forEach((p: any) => {
               state[p.id] = p.status.toLowerCase();
            });
            setStreamingState(state);
          }
          
          if (run.status === "COMPLETED" || run.status === "FAILED") {
            isDone = true;
            if (run.status === "FAILED") {
               setError(run.errorMessage || "Pipeline failed");
            }
          }
        } else {
          isDone = true;
        }
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to execute foundational diligence.");
    } finally {
      setExecuting(false);
    }
  };

  const missingFields = latestRun?.inputSnapshot?.missingFields ?? [];
  const prepared = Boolean(latestRun);
  const hasFoundationalResult = latestRun?.status === "COMPLETED" && latestRun.scorecards.length > 0;
  const foundationalScorecard = latestRun?.scorecards.find((scorecard) => scorecard.framework === "INVESTMENT_VIABILITY" || scorecard.framework === "FOUNDATIONAL_INPUT_READINESS");

  return (
    <div className="max-w-7xl mx-auto space-y-7 font-sans pb-12">
      {!hideHeader && (
        <section className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 border-b border-gray-200 dark:border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 text-green-700 dark:text-[#ccf063] text-[10px] font-bold uppercase tracking-[0.2em] mb-2">
              <Sparkles className="w-3.5 h-3.5" /> Investor intelligence
            </div>
            <h1 className="text-4xl font-serif text-gray-900 dark:text-white">AI Diligence Workspace</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-white/55 max-w-2xl leading-relaxed">
              Prepare an evidence-backed investment analysis. Scores and recommendations remain unavailable until the required evidence is verified.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-white/50 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2">
            <ShieldCheck className="w-4 h-4 text-green-700 dark:text-[#ccf063]" /> Runtime v0.1.0 · evidence-first
          </div>
        </section>
      )}

      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-red-400/30 bg-red-400/10 text-sm text-red-100">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <section className="grid grid-cols-1 lg:grid-cols-[1.1fr_1.9fr] gap-6">
        <div className="bg-white dark:bg-[#191919] border border-gray-200 dark:border-white/10 rounded-2xl p-5 space-y-4 shadow-sm">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-white/45">1. Select startup</p>
            <h2 className="text-lg font-serif text-gray-900 dark:text-white mt-1">Investment target</h2>
          </div>
          {loadingStartups ? (
            <div className="h-24 rounded-xl bg-gray-100 dark:bg-white/5 animate-pulse" />
          ) : (
            <select
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value)}
              disabled={!!initialStartupId}
              className="w-full bg-white dark:bg-[#0e0e0e] border border-gray-300 dark:border-white/10 rounded-xl px-3 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-green-500 dark:focus:border-[#ccf063] disabled:opacity-50"
            >
              {startups.length === 0 && <option value="">No startups available</option>}
              {startups.map((startup) => (
                <option key={startup.id} value={startup.id}>{startup.name} · {startup.stage}</option>
              ))}
            </select>
          )}

          {selectedStartup && (
            <div className="rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/5 p-4 space-y-3">
              <div>
                <p className="font-bold text-gray-900 dark:text-white">{selectedStartup.name}</p>
                <p className="text-xs text-gray-600 dark:text-white/50 mt-1 leading-relaxed">{selectedStartup.tagline}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div><span className="text-gray-500 dark:text-white/40 block">Sector</span><span className="text-gray-900 dark:text-white">{selectedStartup.category}</span></div>
                <div><span className="text-gray-500 dark:text-white/40 block">Stage</span><span className="text-gray-900 dark:text-white">{selectedStartup.stage}</span></div>
                <div><span className="text-gray-500 dark:text-white/40 block">Target</span><span className="text-green-700 dark:text-[#ccf063]">{selectedStartup.targetAmount}</span></div>
                <div><span className="text-gray-500 dark:text-white/40 block">Raised</span><span className="text-gray-900 dark:text-white">{selectedStartup.raisedAmount}</span></div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-[#191919] border border-gray-200 dark:border-white/10 rounded-2xl p-5 sm:p-6 flex flex-col justify-between gap-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-white/45">2. Prepare evidence package</p>
              <h2 className="text-2xl font-serif text-gray-900 dark:text-white mt-1">Investment Diligence</h2>
              <p className="text-xs text-gray-600 dark:text-white/50 mt-2 max-w-xl leading-relaxed">
                This first phase creates a versioned analysis run and captures available startup data. It does not fabricate an AI score.
              </p>
            </div>
            {loadingRun ? <Loader2 className="w-5 h-5 text-green-700 dark:text-[#ccf063] animate-spin" /> : latestRun && (
              <span className="shrink-0 px-3 py-1.5 rounded-full border border-green-700/30 dark:border-[#ccf063]/30 bg-green-50 dark:bg-[#ccf063]/10 text-green-800 dark:text-[#ccf063] text-[10px] font-bold uppercase tracking-wide">
                {latestRun.status.replaceAll("_", " ")}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/5 p-3"><p className="text-[9px] uppercase text-gray-500 dark:text-white/40">Evidence records</p><p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{latestRun?._count.evidence ?? 0}</p></div>
            <div className="rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/5 p-3"><p className="text-[9px] uppercase text-gray-500 dark:text-white/40">Available documents</p><p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{latestRun?.inputSnapshot.availableDocumentCount ?? 0}</p></div>
            <div className="rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/5 p-3"><p className="text-[9px] uppercase text-gray-500 dark:text-white/40">Foundational scorecards</p><p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{latestRun?._count.scorecards ?? 0}</p></div>
          </div>

          <button
            onClick={prepareDiligence}
            disabled={!selectedStartup || preparing}
            className="w-full sm:w-auto self-start inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#ccf063] text-black font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#d7f77c] transition-colors"
          >
            {preparing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {prepared ? "Prepare new run" : "Prepare diligence run"}
            {!preparing && <ArrowRight className="w-4 h-4" />}
          </button>
          {prepared && !hasFoundationalResult && (
            <button
              onClick={executeFoundationalAnalysis}
              disabled={executing}
              className="w-full sm:w-auto self-start inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-[#ccf063]/50 text-[#ccf063] font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#ccf063]/10 transition-colors"
            >
              {executing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
              Run foundational analysis
              {!executing && <ArrowRight className="w-4 h-4" />}
            </button>
          )}
          
          {prepared && (
            <div className="mt-4 p-4 border border-gray-200 dark:border-white/10 rounded-xl bg-gray-50 dark:bg-black/40">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Scenario Simulation</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-gray-500 dark:text-white/50 uppercase tracking-wide mb-1">Override Revenue</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 50k" 
                    value={scenarioOverrides.monthlyRevenue || ""} 
                    onChange={e => setScenarioOverrides(prev => ({ ...prev, monthlyRevenue: e.target.value }))}
                    className="w-full bg-white dark:bg-[#0e0e0e] border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white outline-none focus:border-green-500 dark:focus:border-[#ccf063]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 dark:text-white/50 uppercase tracking-wide mb-1">Override Burn</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 20k" 
                    value={scenarioOverrides.monthlyBurn || ""} 
                    onChange={e => setScenarioOverrides(prev => ({ ...prev, monthlyBurn: e.target.value }))}
                    className="w-full bg-white dark:bg-[#0e0e0e] border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white outline-none focus:border-green-500 dark:focus:border-[#ccf063]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-6">
        <div className="bg-white dark:bg-[#191919] border border-gray-200 dark:border-white/10 rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5"><Brain className="w-4 h-4 text-green-700 dark:text-[#ccf063]" /><h2 className="font-serif text-xl text-gray-900 dark:text-white">Runtime execution plan</h2></div>
          <div className="space-y-3">
            {diligenceWorkerPlan.map((worker, index) => {
              const streamStatus = streamingState[worker.id];
              const isCompletedInDb = latestRun?.status === "COMPLETED" && latestRun.sharedState?.executionPlan?.find((p) => p.id === worker.id)?.status === "COMPLETED";
              const isCompleted = streamStatus === "completed" || isCompletedInDb;
              const isActive = streamStatus === "started" && !isCompleted;
              
              return (
                <div key={worker.id} className={`flex gap-3 p-3 rounded-xl border ${isActive ? "border-green-300 dark:border-[#ccf063]/50 bg-green-50 dark:bg-[#ccf063]/5" : "border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-black/20"}`}>
                  <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${isCompleted ? "bg-green-500 dark:bg-[#ccf063] text-white dark:text-black" : isActive ? "bg-green-500 dark:bg-[#ccf063] text-white dark:text-black animate-pulse" : "bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-white/50"}`}>
                    {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : index + 1}
                  </div>
                  <div className="min-w-0 flex-1"><div className="flex justify-between gap-3"><p className="text-xs font-bold text-gray-900 dark:text-white">{worker.name}</p><span className="text-[9px] uppercase text-gray-400 dark:text-white/35">{isCompleted ? "completed" : isActive ? "running..." : "pending"}</span></div><p className="mt-1 text-[11px] leading-relaxed text-gray-500 dark:text-white/45">{worker.purpose}</p></div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-[#191919] border border-gray-200 dark:border-white/10 rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-green-700 dark:text-[#ccf063]" /><h2 className="font-serif text-xl text-gray-900 dark:text-white">Evidence readiness</h2></div>
          {!prepared ? (
            <div className="mt-8 text-center py-8"><Clock className="w-7 h-7 text-gray-300 dark:text-white/25 mx-auto" /><p className="text-sm text-gray-500 dark:text-white/55 mt-3">Choose a startup and prepare its first diligence run.</p></div>
          ) : missingFields.length > 0 ? (
            <div className="mt-5 space-y-3"><div className="flex gap-2 text-xs text-amber-600 dark:text-amber-200"><AlertTriangle className="w-4 h-4 shrink-0" /><span>{statusCopy[latestRun?.status ?? "AWAITING_EVIDENCE"]}</span></div><p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-white/40">Required next inputs</p>{missingFields.map((field) => <div key={field} className="text-xs text-gray-600 dark:text-white/70 bg-gray-50 dark:bg-black/25 border border-gray-200 dark:border-white/5 rounded-lg px-3 py-2">{field}</div>)}</div>
          ) : (
            <div className="mt-8 text-center py-8"><CheckCircle2 className="w-7 h-7 text-green-600 dark:text-[#ccf063] mx-auto" /><p className="text-sm text-gray-900 dark:text-white mt-3">Profile inputs are ready for evidence verification.</p><p className="text-xs text-gray-500 dark:text-white/45 mt-1">Research and scoring arrive in the next implementation phase.</p></div>
          )}
        </div>
      </section>

      {hasFoundationalResult && foundationalScorecard && (
        <section className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.5fr] gap-6">
          <div className="bg-white dark:bg-[#191919] border border-green-200 dark:border-[#ccf063]/25 rounded-2xl p-5 sm:p-6 flex flex-col shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-green-700 dark:text-[#ccf063]">{foundationalScorecard.framework.replace(/_/g, " ")}</p>
            <div className="flex items-end gap-2 mt-3"><span className="text-5xl font-serif text-gray-900 dark:text-white">{foundationalScorecard.totalScore ?? "—"}</span><span className="text-sm text-gray-400 dark:text-white/45 pb-1">/100</span></div>
            <h2 className="font-serif text-xl text-gray-900 dark:text-white mt-4">AI Execution Scorecard</h2>
            <p className="text-xs leading-relaxed text-gray-600 dark:text-white/55 mt-2">{foundationalScorecard.explanation}</p>
            <div className="mt-5 space-y-2 text-xs">
              {Object.entries(foundationalScorecard.components).map(([name, value]) => (
                <div key={name} className="flex justify-between gap-4 border-b border-gray-100 dark:border-white/5 pb-2"><span className="text-gray-500 dark:text-white/45">{name.replace(/([A-Z])/g, " $1")}</span><span className="font-bold text-gray-900 dark:text-white">{value}/100</span></div>
              ))}
            </div>
            
            {/* Pitch Deck Viewer inside the scorecard column if available */}
            {selectedStartup?.pitchDeckUrl && selectedStartup.pitchDeckUrl !== "#" && (
              <div className="mt-8 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-serif text-sm text-gray-900 dark:text-white">Pitch Deck Preview</h3>
                  <a href={selectedStartup.pitchDeckUrl} target="_blank" rel="noreferrer" className="text-[10px] text-green-700 dark:text-[#ccf063] hover:underline">Open in new tab</a>
                </div>
                <div className="flex-1 min-h-[300px] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden bg-gray-50 dark:bg-black/40">
                   <iframe src={selectedStartup.pitchDeckUrl} className="w-full h-full border-0" />
                </div>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-[#191919] border border-gray-200 dark:border-white/10 rounded-2xl p-5 sm:p-6 shadow-sm">
            <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-green-700 dark:text-[#ccf063]" /><h2 className="font-serif text-xl text-gray-900 dark:text-white">Evidence boundaries & next actions</h2></div>
            <div className="mt-5 space-y-3">
              {latestRun.findings.map((item) => (
                <div key={item.id} className="rounded-xl border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-black/20 p-3">
                  <div className="flex flex-wrap gap-2 items-center justify-between"><p className="text-xs font-bold text-gray-900 dark:text-white">{item.title}</p><span className={`text-[9px] uppercase font-bold px-2 py-1 rounded-full ${item.status === "SUPPORTED" ? "bg-green-100 dark:bg-[#ccf063]/10 text-green-800 dark:text-[#ccf063]" : item.status === "NEEDS_REVIEW" ? "bg-amber-100 dark:bg-amber-400/10 text-amber-700 dark:text-amber-200" : "bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-white/55"}`}>{item.status.replaceAll("_", " ")}</span></div>
                  <p className="mt-2 text-[11px] leading-relaxed text-gray-600 dark:text-white/55">{item.content}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 pt-5 border-t border-gray-200 dark:border-white/10 space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-white/40">Recommended next actions</p>
              {latestRun.recommendations.map((item) => <div key={item.id} className="text-xs text-gray-700 dark:text-white/70 bg-green-50 dark:bg-[#ccf063]/5 border border-green-200 dark:border-[#ccf063]/15 rounded-lg px-3 py-2"><span className="font-bold text-green-700 dark:text-[#ccf063]">{item.priority}. {item.title}</span><span className="block mt-1 text-gray-500 dark:text-white/50">{item.rationale}</span></div>)}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
