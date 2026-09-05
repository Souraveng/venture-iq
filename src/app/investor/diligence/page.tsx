"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { gsap } from "gsap";
import {
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Search,
  Trophy,
  ShieldAlert,
  Check
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import WorkspaceSwitcher from "@/components/investor/WorkspaceSwitcher";

function DiligenceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { userEmail, activeInvestorTeam } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);

  const [rankings, setRankings] = useState<any[]>([]);
  const [shortlisted, setShortlisted] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [mode, setMode] = useState<"loading" | "selection" | "analyzing" | "results" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Escalation State
  const [escalationModalOpen, setEscalationModalOpen] = useState(false);
  const [escalatingStartupId, setEscalatingStartupId] = useState<string | null>(null);
  const [analystNote, setAnalystNote] = useState("");
  const [isEscalating, setIsEscalating] = useState(false);

  // Sharing State
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [userTeamId, setUserTeamId] = useState<string | null>(null);
  const [shareWithAll, setShareWithAll] = useState(true);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);

  useEffect(() => {
    if (!userEmail) return;
    fetch(`/api/teams`, { headers: { "x-user-email": userEmail }})
      .then(res => res.json())
      .then((data: any) => {
        if (data.success && data.teams.length > 0) {
          const matchedTeam = activeInvestorTeam ? data.teams.find((t: any) => t.id === activeInvestorTeam.id) : data.teams[0];
          const team = matchedTeam || data.teams[0];
          setUserTeamId(team.id);
          setTeamMembers(team.members.filter((m: any) => m.userEmail !== userEmail));
        }
      })
      .catch(console.error);
  }, [userEmail, activeInvestorTeam]);

  useEffect(() => {
    if (!userEmail) return;
    const ids = searchParams.get("ids");
    
    if (!ids) {
      // Enter selection mode
      setMode("loading");
      const teamQuery = activeInvestorTeam?.id ? `&teamId=${encodeURIComponent(activeInvestorTeam.id)}` : "";
      fetch(`/api/startups/liked?email=${encodeURIComponent(userEmail)}${teamQuery}`)
        .then(res => res.json())
        .then((json: any) => {
          if (json.success) {
            setShortlisted(json.data || []);
            setMode("selection");
          } else {
            setErrorMsg(json.error || "Failed to fetch shortlisted deals.");
            setMode("error");
          }
        })
        .catch((err) => {
          console.error(err);
          setErrorMsg("Error fetching deals.");
          setMode("error");
        });
      return;
    }

    // Run Diligence
    setMode("analyzing");
    const startupIds = ids.split(",").map(id => id.trim());

    fetch("/api/diligence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startupIds, investorEmail: userEmail })
    })
      .then(res => res.json())
      .then((json: any) => {
        if (json.success) {
          setRankings(json.data.sort((a: any, b: any) => a.rank - b.rank));
          setMode("results");
        } else {
          setErrorMsg(json.error || "Failed to run agentic diligence.");
          setMode("error");
        }
      })
      .catch(err => {
        console.error(err);
        setErrorMsg("An error occurred during AI analysis.");
        setMode("error");
      });
  }, [searchParams, userEmail]);

  useEffect(() => {
    if (mode === "results" && rankings.length > 0) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          ".animate-item",
          { y: 6, opacity: 0.85 },
          { y: 0, opacity: 1, duration: 0.3, ease: "power2.out" }
        );
      }, containerRef);
      return () => ctx.revert();
    }
  }, [mode, rankings.length]);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleRunAgent = () => {
    if (selectedIds.length === 0) return;
    router.push(`/investor/diligence?ids=${selectedIds.join(",")}`);
  };

  const submitEscalation = async () => {
    if (!escalatingStartupId || !userEmail) return;
    setIsEscalating(true);
    try {
      const res = await fetch("/api/escalations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startupId: escalatingStartupId,
          escalatedBy: userEmail,
          escalatedToRole: "Investment Committee",
          analystNote,
          teamId: userTeamId,
          shareWithAll,
          sharedWithEmails: shareWithAll ? [] : selectedEmails
        })
      });
      const json = (await res.json()) as any;
      if (json.success) {
        setEscalationModalOpen(false);
        setAnalystNote("");
        setEscalatingStartupId(null);
        router.push("/investor/escalations");
      } else {
        alert("Escalation failed: " + json.error);
      }
    } catch (e) {
      alert("Failed to escalate deal.");
    } finally {
      setIsEscalating(false);
    }
  };

  if (mode === "error") {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl backdrop-blur-md">
          <div className="bg-red-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">Notice</h2>
          <p className="text-sm text-zinc-600 dark:text-[#c5c9b2] mb-8 bg-black/5 dark:bg-black/40 p-4 rounded-lg border border-black/5 dark:border-white/5">
            {errorMsg}
          </p>
          <button 
            onClick={() => {
              if (errorMsg?.includes("fetch shortlisted")) {
                router.push('/investor/feed');
              } else {
                router.back();
              }
            }}
            className="w-full bg-[#ccf063] hover:bg-[#b5d556] text-black px-6 py-3 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]"
          >
            {errorMsg?.includes("fetch shortlisted") ? "Go to Discovery Feed" : "Go Back"}
          </button>
        </div>
      </div>
    );
  }

  if (mode === "loading" || mode === "analyzing") {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-8">
        <div className="relative">
          <div className="w-24 h-24 border-4 border-black/5 dark:border-white/5 rounded-full absolute inset-0"></div>
          <div className="w-24 h-24 border-4 border-t-[#ccf063] rounded-full animate-spin"></div>
          <Sparkles className="w-8 h-8 text-[#ccf063] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-serif italic text-zinc-900 dark:text-white animate-pulse">
            {mode === "analyzing" ? "Agentic Workflow Active" : "Loading Workspace..."}
          </h2>
          <p className="text-sm text-zinc-600 dark:text-[#c5c9b2]">
            {mode === "analyzing" 
              ? "AI Agents are analyzing specs and validating facts via Google Search Grounding..." 
              : "Preparing intelligence suite..."}
          </p>
        </div>
      </div>
    );
  }

  if (mode === "selection") {
    return (
      <div className="min-h-screen relative overflow-hidden bg-zinc-50 dark:bg-transparent">
        <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-[#ccf063]/10 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />
        <div className="fixed bottom-0 right-1/4 w-[600px] h-[600px] bg-violet-600/10 blur-[150px] rounded-full pointer-events-none mix-blend-screen" />
        
        <div className="relative z-10 max-w-4xl mx-auto py-12 px-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="p-2 bg-black/5 dark:bg-white/5 hover:bg-black/5 dark:bg-black/10 dark:bg-white/10 rounded-full text-white/70 hover:text-zinc-900 dark:text-white">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-3xl font-bold text-zinc-900 dark:text-white font-serif flex items-center gap-2">
                  Select Deals for AI Diligence
                </h2>
                <p className="text-zinc-600 dark:text-[#c5c9b2] mt-1 text-sm">Choose from your shortlisted pipeline to run a deep-dive analysis.</p>
              </div>
            </div>
            <WorkspaceSwitcher compact />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {shortlisted.map(startup => (
              <div 
                key={startup.id} 
                onClick={() => toggleSelection(startup.id)}
                className={`p-4 rounded-2xl border cursor-pointer flex items-center gap-4 transition-all ${
                  selectedIds.includes(startup.id) ? 'bg-[#ccf063]/10 border-[#ccf063]' : 'bg-[#1f1f1f] border-black/10 dark:border-white/10 hover:border-white/30'
                }`}
              >
                <div className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 ${
                  selectedIds.includes(startup.id) ? 'bg-[#ccf063] border-[#ccf063] text-black' : 'border-white/30 bg-black/5 dark:bg-black/40'
                }`}>
                  {selectedIds.includes(startup.id) && <Check className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                  <h3 className="text-zinc-900 dark:text-white font-bold truncate">{startup.name}</h3>
                  <p className="text-xs text-zinc-600 dark:text-[#c5c9b2] truncate">{startup.tagline}</p>
                </div>
              </div>
            ))}
            {shortlisted.length === 0 && (
              <div className="col-span-full py-20 text-center text-zinc-600 dark:text-[#c5c9b2]">
                You haven't shortlisted any deals yet. Go to the Discovery Feed to find matches!
              </div>
            )}
          </div>

          {selectedIds.length > 0 && (
            <div className="flex justify-center">
              <button 
                onClick={handleRunAgent}
                className="bg-[#ccf063] text-black font-bold py-3 px-8 rounded-full flex items-center gap-2 hover:bg-[#bce650] transition-transform hover:scale-105 shadow-[0_0_30px_rgba(204,240,99,0.2)]"
              >
                <Sparkles className="w-5 h-5" /> Run AI Agent on {selectedIds.length} Deal{selectedIds.length > 1 ? 's' : ''}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-zinc-50 dark:bg-transparent">
      {/* Background gradients */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-[#ccf063]/10 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />
      <div className="fixed bottom-0 right-1/4 w-[600px] h-[600px] bg-violet-600/10 blur-[150px] rounded-full pointer-events-none mix-blend-screen" />
      
      <div ref={containerRef} className="relative z-10 space-y-8 max-w-5xl mx-auto font-sans pb-12 pt-8 px-6">
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-black/10 dark:border-white/10 pb-6">
        <button 
          onClick={() => router.back()}
          className="p-2 bg-black/5 dark:bg-white/5 hover:bg-black/5 dark:bg-black/10 dark:bg-white/10 rounded-full transition-colors text-white/70 hover:text-zinc-900 dark:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white font-serif flex items-center gap-2">
            AI Diligence Portal <Sparkles className="w-5 h-5 text-[#ccf063]" />
          </h2>
          <p className="text-xs text-zinc-600 dark:text-[#c5c9b2] mt-1">
            Comparative analysis powered by LangGraph & Gemini Search Grounding.
          </p>
        </div>
      </div>

      {/* Rankings */}
      <div className="space-y-6">
        {rankings.map((startup, idx) => (
          <div 
            key={idx}
            className={`animate-item bg-[#1f1f1f]/80 backdrop-blur-xl border rounded-3xl p-8 relative overflow-hidden shadow-2xl transition-all duration-300 hover:-translate-y-1 ${
              startup.rank === 1 ? "border-[#ccf063] shadow-[0_0_40px_rgba(204,240,99,0.15)]" : "border-black/10 dark:border-white/10 hover:border-white/20"
            }`}
          >
            {startup.rank === 1 && (
              <div className="absolute top-0 right-0 bg-[#ccf063] text-black px-6 py-1.5 rounded-bl-2xl font-bold text-xs flex items-center gap-1.5 shadow-lg">
                <Trophy className="w-4 h-4" /> Top Recommendation
              </div>
            )}
            
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg border ${
                    startup.rank === 1 ? "bg-[#ccf063]/10 border-[#ccf063]/30 text-[#ccf063]" : "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-zinc-900 dark:text-white"
                  }`}>
                    #{startup.rank}
                  </div>
                  <h3 className="text-2xl font-bold text-zinc-900 dark:text-white font-serif">{startup.startupName || startup.startupId}</h3>
                </div>
                <p className="text-sm text-zinc-600 dark:text-[#c5c9b2] max-w-3xl leading-relaxed mt-4">
                  {startup.reason}
                </p>
              </div>
              {startup.rank === 1 && (
                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch("/api/interactions", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ startupId: startup.startupId, action: "request_intro", investorEmail: userEmail }),
                        });
                        const json = (await res.json()) as { success?: boolean };
                        if (json?.success) {
                          alert(`Deal request for "${startup.startupName || startup.startupId}" sent successfully!`);
                        } else {
                          alert("Failed to send deal request.");
                        }
                      } catch (err) {
                        console.error(err);
                        alert("Error sending deal request.");
                      }
                    }}
                    className="bg-[#ccf063] hover:bg-[#bce650] text-black px-6 py-2 rounded-xl font-bold text-sm shadow-lg transition-transform hover:scale-105"
                  >
                    Request for Deal
                  </button>
                </div>
              )}
              <div className="hidden sm:block">
                <button 
                  onClick={() => {
                    setEscalatingStartupId(startup.id || startup.startupId);
                    setEscalationModalOpen(true);
                  }}
                  className="bg-[#ccf063]/10 hover:bg-[#ccf063]/20 text-[#ccf063] border border-[#ccf063]/30 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95"
                >
                  <AlertTriangle className="w-4 h-4" /> Escalate to IC
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Strengths */}
              <div className="bg-black/30 border border-green-500/10 rounded-2xl p-5">
                <h4 className="text-sm font-bold text-green-400 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Key Strengths
                </h4>
                <ul className="space-y-2">
                  {startup.keyStrengths?.map((str: string, i: number) => (
                    <li key={i} className="text-xs text-zinc-600 dark:text-[#c5c9b2] flex items-start gap-2">
                      <span className="text-green-500/50 mt-0.5">•</span> {str}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Risks */}
              <div className="bg-black/30 border border-red-500/10 rounded-2xl p-5">
                <h4 className="text-sm font-bold text-red-400 mb-3 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" /> Identified Risks
                </h4>
                <ul className="space-y-2">
                  {startup.keyRisks?.map((risk: string, i: number) => (
                    <li key={i} className="text-xs text-zinc-600 dark:text-[#c5c9b2] flex items-start gap-2">
                      <span className="text-red-500/50 mt-0.5">•</span> {risk}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Validation Notes from Search Grounding */}
            {startup.validationNotes && (
              <div className="bg-[#ccf063]/5 border border-[#ccf063]/20 rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#ccf063]/10 blur-3xl rounded-full -mr-10 -mt-10"></div>
                <h4 className="text-sm font-bold text-[#ccf063] mb-2 flex items-center gap-2 relative z-10">
                  <Search className="w-4 h-4" /> Search Grounding Fact Check
                </h4>
                <p className="text-xs text-zinc-600 dark:text-[#c5c9b2] leading-relaxed relative z-10">
                  {startup.validationNotes}
                </p>
              </div>
            )}
          </div>
        ))}

        {rankings.length === 0 && mode === "results" && (
          <div className="text-center py-20 text-zinc-600 dark:text-[#c5c9b2] text-sm">
            Could not parse valid rankings from the AI output.
          </div>
        )}
      </div>
      
      {/* Escalation Modal */}
      {escalationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/60 dark:bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1a1a] border border-black/10 dark:border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative">
            <button 
              onClick={() => setEscalationModalOpen(false)}
              className="absolute top-4 right-4 text-white/50 hover:text-zinc-900 dark:text-white"
            >
              ×
            </button>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#ccf063]" /> Escalate to Investment Committee
            </h3>
            <p className="text-sm text-zinc-600 dark:text-[#c5c9b2] mb-6">
              This will generate an AI-synthesized Handoff Note for the IC using your context and the automated diligence report.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-white/70 mb-2">Escalate To</label>
                <input 
                  type="text" 
                  disabled 
                  value="Investment Committee" 
                  className="w-full bg-black/5 dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-lg p-3 text-sm text-white/50"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-white/70 mb-2">Analyst Note (Optional Context)</label>
                <textarea 
                  value={analystNote}
                  onChange={(e) => setAnalystNote(e.target.value)}
                  placeholder="Why are you escalating this deal? e.g. 'Strong founder background but need IC approval on the valuation ask.'"
                  className="w-full bg-black/5 dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-lg p-3 text-sm text-zinc-900 dark:text-white placeholder-white/30 h-32 focus:border-[#ccf063] focus:outline-none focus:ring-1 focus:ring-[#ccf063]"
                />
              </div>
              
              {teamMembers.length > 0 && (
                <div className="bg-black/30 border border-black/5 dark:border-white/5 p-4 rounded-xl">
                  <label className="flex items-center gap-2 text-sm text-zinc-900 dark:text-white font-bold cursor-pointer mb-3">
                    <input 
                      type="checkbox" 
                      checked={shareWithAll} 
                      onChange={(e) => setShareWithAll(e.target.checked)}
                      className="rounded border-white/20 bg-white dark:bg-black/50 text-[#ccf063] focus:ring-[#ccf063] accent-[#ccf063]"
                    />
                    Share with all team members
                  </label>
                  
                  {!shareWithAll && (
                    <div className="pl-6 space-y-2 max-h-32 overflow-y-auto">
                      <p className="text-xs text-white/50 mb-2">Select specific members to share with:</p>
                      {teamMembers.map(member => (
                        <label key={member.userEmail} className="flex items-center gap-2 text-sm text-zinc-600 dark:text-[#c5c9b2] cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={selectedEmails.includes(member.userEmail)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedEmails(prev => [...prev, member.userEmail]);
                              } else {
                                setSelectedEmails(prev => prev.filter(email => email !== member.userEmail));
                              }
                            }}
                            className="rounded border-white/20 bg-white dark:bg-black/50 text-[#ccf063] focus:ring-[#ccf063] accent-[#ccf063]"
                          />
                          {member.userEmail} <span className="text-white/30 text-xs">({member.role})</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button 
                onClick={() => setEscalationModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white/70 hover:text-zinc-900 dark:text-white hover:bg-black/5 dark:bg-white/5"
              >
                Cancel
              </button>
              <button 
                onClick={submitEscalation}
                disabled={isEscalating}
                className="bg-[#ccf063] hover:bg-[#bce650] text-black px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                {isEscalating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    Generating Note...
                  </>
                ) : (
                  <>Generate & Escalate</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}

export default function DiligencePortalPage() {
  return (
    <Suspense fallback={<div className="p-10 text-zinc-900 dark:text-white">Loading Portal...</div>}>
      <DiligenceContent />
    </Suspense>
  );
}
