"use client";

import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import {
  Search,
  Award,
  X,
  Play,
  FileText,
  Eye,
  Bookmark,
  Handshake,
  XCircle,
  Sparkles,
  Check,
  CheckCircle2,
  LayoutGrid,
  List as ListIcon
} from "lucide-react";
import { useRouter } from "next/navigation";
import { PitchDetails } from "@/components/PitchDetails";
import { useAuth } from "@/context/AuthContext";

const PASS_REASONS = [
  "Wrong Sector",
  "Too Early",
  "Ticket Size Mismatch",
  "Geography",
  "Weak Traction",
  "Valuation Too High",
  "Not interested currently",
  "Other"
];

export default function InvestorPitchFeedPage() {
  const { userEmail } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [startups, setStartups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDeals, setSelectedDeals] = useState<string[]>([]);
  const router = useRouter();
  
  // Interaction states: { [startupId]: "SHORTLISTED" | "PASSED" | "INTRO_REQUESTED" }
  const [interactions, setInteractions] = useState<Record<string, string>>({});
  
  // View states
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  // Modal states
  const [selectedStartup, setSelectedStartup] = useState<any | null>(null);
  const [passModalStartup, setPassModalStartup] = useState<any | null>(null);
  const [passReason, setPassReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch shortlisted startups from API
  useEffect(() => {
    if (!userEmail) return;
    setLoading(true);
    fetch(`/api/startups/liked?email=${encodeURIComponent(userEmail)}`)
      .then(res => res.json())
      .then((json: any) => {
        if (json.success) {
          setStartups(json.data.map((s: any) => ({
            ...s,
            // Mock a breakdown for UI purposes since we aren't querying the AI engine directly here
            matchBreakdown: {
              thesis: 90,
              stage: 85,
              geography: 95,
              ticketSize: 88,
              traction: 92,
            }
          })));
          
          // Seed interactions from DB state
          const initialInteractions: Record<string, string> = {};
          json.data.forEach((s: any) => {
            initialInteractions[s.id] = s.interactionState;
          });
          setInteractions(initialInteractions);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch startups:", err);
        setLoading(false);
      });
  }, [userEmail]);

  // GSAP animations
  useEffect(() => {
    if (!loading && startups.length > 0) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          ".animate-item",
          { y: 6, opacity: 0.85 },
          { y: 0, opacity: 1, duration: 0.3, ease: "power2.out" }
        );
      }, containerRef);
      return () => ctx.revert();
    }
  }, [loading, startups]);

  const handleAction = async (e: React.MouseEvent, action: string, startup: any) => {
    e.stopPropagation();

    if (action === 'explore') {
      setSelectedStartup(startup);
      return;
    }

    if (action === 'pass') {
      setPassModalStartup(startup);
      return;
    }

    // Handle Shortlist & Request Intro immediately
    setIsSubmitting(true);
    try {
      await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startupId: startup.id, action, investorEmail: userEmail })
      });
      setInteractions(prev => ({ ...prev, [startup.id]: action }));
    } catch (err) {
      console.error("Action failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmPass = async () => {
    if (!passModalStartup) return;
    setIsSubmitting(true);
    
    try {
      await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          startupId: passModalStartup.id, 
          action: 'pass',
          feedback: passReason,
          investorEmail: userEmail
        })
      });
      setInteractions(prev => ({ ...prev, [passModalStartup.id]: 'PASSED' }));
      setPassModalStartup(null);
      setPassReason("");
    } catch (err) {
      console.error("Pass failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter out passed startups and apply search
  const visibleStartups = startups.filter(s => interactions[s.id] !== 'PASSED');
  
  const searchFilteredStartups = visibleStartups.filter(startup => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      startup.name?.toLowerCase().includes(query) ||
      startup.founder?.toLowerCase().includes(query) ||
      startup.category?.toLowerCase().includes(query) ||
      startup.stage?.toLowerCase().includes(query)
    );
  });

  const toggleSelection = (startupId: string) => {
    setSelectedDeals((prev) =>
      prev.includes(startupId)
        ? prev.filter((id) => id !== startupId)
        : [...prev, startupId]
    );
  };

  const renderCard = (item: any) => {
    const isShortlisted = interactions[item.id] === 'SHORTLISTED';
    const isIntroReq = interactions[item.id] === 'INTRO_REQUESTED' || interactions[item.id] === 'request_intro'; // handle string mismatch
    const isSelected = selectedDeals.includes(item.id);

    return (
      <div
        key={item.id}
        onClick={() => toggleSelection(item.id)}
        className={`animate-item bg-[#1f1f1f] border rounded-2xl p-6 transition-all duration-300 group flex flex-col shadow-lg relative overflow-hidden cursor-pointer ${
          isSelected ? 'border-[#ccf063] ring-1 ring-[#ccf063]' : (isShortlisted ? 'border-[#ccf063]/50' : 'border-white/10 hover:border-[#ccf063]/50')
        }`}
      >
        {isShortlisted && (
          <div className="absolute -top-3 -right-3 w-16 h-16 bg-[#ccf063] rounded-bl-full flex items-center justify-center pointer-events-none opacity-20" />
        )}
        
        {/* Checkbox */}
        <div className="absolute top-4 left-4 z-20">
          <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
            isSelected ? "bg-[#ccf063] border-[#ccf063]" : "border-white/30 group-hover:border-[#ccf063]/50 bg-black/20"
          }`}>
            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-black" />}
          </div>
        </div>
        
        {/* Top Section */}
        <div className="flex justify-between items-start mb-4 relative z-10 pl-8">
          <div>
            <h3 className="text-xl font-bold text-white mb-1 font-serif group-hover:text-[#ccf063] transition-colors">
              {item.name}
            </h3>
            <p className="text-xs text-[#c5c9b2]">
              {item.stage || "Seed"} &middot; {item.location || "Global"} &middot; {item.category || "Tech"}
            </p>
          </div>
          <div className="flex flex-col items-end">
            {item.matchScore ? (
              <div className="flex items-center gap-1.5 bg-[#ccf063]/10 border border-[#ccf063]/30 px-3 py-1 rounded-full text-xs font-bold text-[#ccf063]">
                <Award className="w-3.5 h-3.5" /> {item.matchScore}% Match
              </div>
            ) : null}
          </div>
        </div>

        <p className="text-[11px] text-[#c5c9b2] mb-6 line-clamp-2 relative z-10 italic">
          "{item.tagline}"
        </p>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-[11px] mb-6 relative z-10">
          <div>
            <span className="text-white/40 block mb-0.5">Raising</span>
            <span className="font-bold text-[#ccf063] text-sm">{item.targetAmount || "$0"}</span>
          </div>
          <div>
            <span className="text-white/40 block mb-0.5">Valuation</span>
            <span className="font-bold text-white text-sm">{item.valuation || "N/A"}</span>
          </div>
          <div>
            <span className="text-white/40 block mb-0.5">Founder</span>
            <span className="font-bold text-white truncate block">{item.founder || "N/A"}</span>
          </div>
        </div>

        {/* 4 Actions */}
        <div className="mt-auto grid grid-cols-4 gap-2 relative z-10 pt-4 border-t border-white/5">
          <button 
            onClick={(e) => handleAction(e, 'explore', item)}
            className="flex flex-col items-center justify-center py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            title="Explore"
          >
            <Eye className="w-4 h-4 mb-1" />
            <span className="text-[9px] font-semibold">Explore</span>
          </button>
          
          <button 
            onClick={(e) => { e.stopPropagation(); router.push(`/investor/diligence?ids=${item.id}`); }}
            className="flex flex-col items-center justify-center py-2 rounded-lg bg-[#ccf063]/10 hover:bg-[#ccf063]/20 border border-[#ccf063]/30 text-[#ccf063] transition-colors"
            title="AI Diligence"
          >
            <Sparkles className="w-4 h-4 mb-1" />
            <span className="text-[9px] font-semibold">AI Agent</span>
          </button>
          
          <button 
            onClick={(e) => handleAction(e, 'request_intro', item)}
            className={`flex flex-col items-center justify-center py-2 rounded-lg transition-colors border ${
              isIntroReq
                ? 'bg-[#ccf063] text-black border-[#ccf063]'
                : 'bg-[#ccf063]/10 hover:bg-[#ccf063] text-[#ccf063] hover:text-black border-[#ccf063]/30'
            }`}
            title="Request Intro"
          >
            {isIntroReq ? <Check className="w-4 h-4 mb-1" /> : <Handshake className="w-4 h-4 mb-1" />}
            <span className="text-[9px] font-semibold">{isIntroReq ? 'Requested' : 'Req Intro'}</span>
          </button>
          
          <button 
            onClick={(e) => handleAction(e, 'pass', item)}
            className="flex flex-col items-center justify-center py-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/70 hover:text-red-400 transition-colors"
            title="Pass"
          >
            <XCircle className="w-4 h-4 mb-1" />
            <span className="text-[9px] font-semibold">Pass</span>
          </button>
        </div>
      </div>
    );
  };

  const renderListCard = (item: any) => {
    const interactionState = interactions[item.id] || item.interactionState;
    if (interactionState === "PASSED") return null;
    
    const isIntroReq = interactionState === "INTRO_REQUESTED";
    const isSelected = selectedDeals.includes(item.id);

    return (
      <div 
        key={item.id} 
        className={`animate-item relative flex flex-col md:flex-row items-center gap-6 p-4 rounded-2xl border transition-all cursor-pointer overflow-hidden ${
          isSelected 
            ? 'border-[#ccf063] bg-[#ccf063]/5' 
            : 'border-white/5 bg-[#1f1f1f] hover:border-white/20'
        }`}
        onClick={() => toggleSelection(item.id)}
      >
        <div className="absolute top-4 left-4 z-20">
          <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
            isSelected ? 'bg-[#ccf063] border-[#ccf063] text-black' : 'border-white/30 bg-black/40'
          }`}>
            {isSelected && <Check className="w-3.5 h-3.5" />}
          </div>
        </div>

        {/* Thumbnail */}
        <div className="w-full md:w-48 h-32 rounded-xl overflow-hidden bg-black shrink-0 relative">
          <img src={item.logoUrl || "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&q=80"} alt={item.name} className="w-full h-full object-cover opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          <div className="absolute bottom-2 left-3 right-3 text-white">
            <h3 className="font-serif font-bold text-lg truncate group-hover:text-[#ccf063] transition-colors">{item.name}</h3>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-xs text-[#c5c9b2]">
                {item.stage || "Seed"} &middot; {item.location || "Global"} &middot; {item.category || "Tech"}
              </p>
            </div>
            {item.matchScore && (
              <div className="flex items-center gap-1.5 bg-[#ccf063]/10 border border-[#ccf063]/30 px-3 py-1 rounded-full text-xs font-bold text-[#ccf063]">
                <Award className="w-3.5 h-3.5" /> {item.matchScore}% Match
              </div>
            )}
          </div>
          <p className="text-[11px] text-[#c5c9b2] line-clamp-2 italic mb-3">"{item.tagline}"</p>
          <div className="flex gap-6 text-[11px]">
            <div><span className="text-white/40 mr-1">Raising:</span><span className="font-bold text-[#ccf063]">{item.targetAmount || "$0"}</span></div>
            <div><span className="text-white/40 mr-1">Val:</span><span className="font-bold text-white">{item.valuation || "N/A"}</span></div>
            <div><span className="text-white/40 mr-1">Founder:</span><span className="font-bold text-white truncate">{item.founder || "N/A"}</span></div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-row md:flex-col gap-2 shrink-0 w-full md:w-32">
          <button 
            onClick={(e) => handleAction(e, 'explore', item)}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            title="Explore"
          >
            <Eye className="w-4 h-4" />
            <span className="text-[10px] font-semibold">Explore</span>
          </button>
          
          <button 
            onClick={(e) => { e.stopPropagation(); router.push(`/investor/diligence?ids=${item.id}`); }}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-[#ccf063]/10 hover:bg-[#ccf063]/20 border border-[#ccf063]/30 text-[#ccf063] transition-colors"
            title="AI Diligence"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-[10px] font-semibold">AI Agent</span>
          </button>
          
          <button 
            onClick={(e) => handleAction(e, 'request_intro', item)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-colors border ${
              isIntroReq
                ? 'bg-[#ccf063] text-black border-[#ccf063]'
                : 'bg-[#ccf063]/10 hover:bg-[#ccf063] text-[#ccf063] hover:text-black border-[#ccf063]/30'
            }`}
            title="Request Intro"
          >
            {isIntroReq ? <Check className="w-4 h-4" /> : <Handshake className="w-4 h-4" />}
            <span className="text-[10px] font-semibold">{isIntroReq ? 'Requested' : 'Req Intro'}</span>
          </button>
          
          <button 
            onClick={(e) => handleAction(e, 'pass', item)}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/70 hover:text-red-400 transition-colors"
            title="Pass"
          >
            <XCircle className="w-4 h-4" />
            <span className="text-[10px] font-semibold">Pass</span>
          </button>
        </div>

      </div>
    );
  };

  return (
    <div ref={containerRef} className="space-y-12 max-w-7xl mx-auto font-sans pb-20 relative">
      
      {/* Header */}
      <div className="flex justify-between items-end border-b border-white/5 pb-6 pt-4">
        <div className="animate-item">
          <span className="text-[#ccf063] font-bold text-xs uppercase tracking-widest block mb-1">Your Pipeline</span>
          <h2 className="text-4xl font-serif text-white">Shortlisted Deals</h2>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg border transition-colors ${viewMode === "grid" ? "bg-white/10 border-white/20 text-white" : "border-transparent text-white/50 hover:text-white"}`}
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-lg border transition-colors ${viewMode === "list" ? "bg-white/10 border-white/20 text-white" : "border-transparent text-white/50 hover:text-white"}`}
          >
            <ListIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <section className="animate-item bg-[#1f1f1f] border border-white/10 rounded-2xl p-4 flex items-center gap-3">
        <Search className="w-5 h-5 text-[#c5c9b2]" />
        <input 
          type="text" 
          placeholder="Search your shortlisted startups by name, industry, founder, or stage..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent text-white focus:outline-none text-sm placeholder:text-[#c5c9b2]/60"
        />
      </section>

      {loading ? (
        <div className="flex justify-center items-center py-20 text-[#c5c9b2] text-sm">
           <div className="w-5 h-5 border-2 border-[#ccf063] border-t-transparent rounded-full animate-spin mr-3" />
           Loading Pipeline...
        </div>
      ) : (
        <div className="space-y-12">
          {/* All Results */}
          <section>
            <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
              {searchFilteredStartups.length > 0 ? (
                searchFilteredStartups.map(s => viewMode === "grid" ? renderCard(s) : renderListCard(s))
              ) : (
                <div className="col-span-full py-20 text-center text-[#c5c9b2] text-sm border border-white/5 rounded-2xl bg-[#1f1f1f] flex flex-col items-center justify-center">
                  <Sparkles className="w-8 h-8 mb-4 text-[#ccf063]/50" />
                  {searchQuery 
                    ? `No shortlisted startups found matching "${searchQuery}"`
                    : "You haven't shortlisted any deals yet. Discover matches in the AI Discovery feed."}
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* Floating Action Bar for Selected Deals */}
      {selectedDeals.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-[#1a1a1a] border border-[#ccf063]/30 shadow-2xl rounded-2xl py-3 px-6 flex items-center gap-6">
            <div className="text-white text-sm font-bold whitespace-nowrap">
              <span className="text-[#ccf063] mr-1">{selectedDeals.length}</span> deals selected
            </div>
            <button 
              onClick={() => router.push(`/investor/diligence?ids=${selectedDeals.join(",")}`)}
              className="bg-[#ccf063] hover:bg-[#bce650] text-black font-bold py-2 px-6 rounded-xl flex items-center gap-2 transition-colors whitespace-nowrap text-sm shadow-md"
            >
              <Sparkles className="w-4 h-4" />
              Run Agentic Diligence on Group
            </button>
          </div>
        </div>
      )}

      {/* Match DNA Modal */}
      {selectedStartup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedStartup(null)} />
          
          <div className="relative bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col md:flex-row">
            <button 
              className="absolute top-4 right-4 z-20 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors"
              onClick={() => setSelectedStartup(null)}
            >
              <X className="w-5 h-5" />
            </button>
            {/* Main Content Area: Pitch Details */}
            <div className="w-full bg-[#121212] overflow-y-auto custom-scrollbar p-6">
              <PitchDetails startup={selectedStartup} onClose={() => setSelectedStartup(null)} />
            </div>
          </div>
        </div>
      )}

      {/* Pass Feedback Modal */}
      {passModalStartup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setPassModalStartup(null)} />
          <div className="relative bg-[#1f1f1f] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-xl font-serif text-white mb-2">Why are you passing?</h3>
            <p className="text-xs text-[#c5c9b2] mb-6">
              Help AI DealMatch learn your preferences by providing a reason for passing on <span className="text-white font-bold">{passModalStartup.name}</span>.
            </p>
            
            <div className="grid grid-cols-2 gap-2 mb-6">
              {PASS_REASONS.map(reason => (
                <button
                  key={reason}
                  onClick={() => setPassReason(reason)}
                  className={`text-xs p-3 rounded-xl border transition-colors ${
                    passReason === reason 
                      ? 'bg-[#ccf063] border-[#ccf063] text-black font-bold'
                      : 'bg-white/5 border-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            <div className="flex gap-3 mt-6 pt-6 border-t border-white/5">
              <button 
                onClick={() => setPassModalStartup(null)}
                className="flex-1 py-3 text-sm font-bold text-white/50 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmPass}
                disabled={isSubmitting || !passReason}
                className="flex-1 bg-[#ccf063] hover:bg-[#bce650] disabled:bg-white/10 disabled:text-white/30 text-black font-bold py-3 rounded-xl transition-colors text-sm flex items-center justify-center"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Confirm Pass"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
