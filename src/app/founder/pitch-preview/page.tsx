"use client";

import React, { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  CheckCircle2,
  Bookmark,
  FileText,
  Mail,
  Sliders,
  Play,
  Pause,
  Subtitles,
  Volume2,
  VolumeX,
  X,
  ExternalLink,
  ArrowUpRight,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";

function PitchPreviewContent() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  const searchParams = useSearchParams();
  const previewId = searchParams.get("preview");
  const { userName } = useAuth();
  
  const [current, setCurrent] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [showCaptions, setShowCaptions] = useState(true);
  const [showDetailsSheet, setShowDetailsSheet] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (previewId && userName) {
      fetch(`/api/startups?founder=${encodeURIComponent(userName)}`)
        .then((res) => res.json())
        .then((json: any) => {
          if (json.success && json.data) {
            const found = json.data.find((s: any) => s.id === previewId);
            if (found) {
              setCurrent({
                id: found.id,
                name: found.name,
                founder: found.founder || "Founder",
                tagline: found.tagline || "No tagline provided",
                category: found.category || "General",
                location: found.location || "Global",
                stage: found.stage || "Seed",
                valuation: found.valuationCap || found.valuation || "TBD",
                targetAmount: found.targetAmount || "TBD",
                arr: found.arrMrr || "$0",
                mrr: found.mrr || "$0",
                burn: found.monthlyBurn || "$0",
                runway: found.runway ? `${found.runway} Months` : "N/A",
                minTicket: found.minTicket || "$0",
                equityOffered: found.equityOffered ? `${found.equityOffered}%` : "N/A",
                roundType: found.roundType || "Seed",
                pitchDeckUrl: found.pitchDeckUrl || "#",
                problemText: found.problemText || found.coreProblem || "No problem statement provided.",
                solutionText: found.solutionText || found.proposedSolution || "No solution description provided.",
                growth: found.mrrGrowthRate ? `${found.mrrGrowthRate}%` : "N/A",
                goal: found.targetAmount || "TBD",
                aiScore: "92",
                tam: found.tam || found.valuation || "TBD",
                sam: found.sam || "TBD",
                som: found.som || "TBD",
                tags: [found.category || "Tech", found.location ? found.location.split(',')[0] : "Global"],
                avatar: found.founderProfile?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(found.founder || "F")}&backgroundColor=ccf063&textColor=000000`,
                videoUrl: found.founderProfile?.introVideoUrl?.includes(".mp4") ? found.founderProfile.introVideoUrl : (found.introVideoUrl || "https://www.w3schools.com/html/mov_bbb.mp4"),
                aiSummary: found.problemText || found.coreProblem || "AI summary generated from startup due-diligence data.",
                match: "92%",
                videoFormat: found.videoFormat || "16:9"
              });
            }
          }
          setLoading(false);
        });
    }
  }, [previewId, userName]);

  const togglePlay = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }
  };

  const toggleMute = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (videoRef.current) {
      const nextMuted = !isMuted;
      videoRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
    }
  };

  useEffect(() => {
    if (videoRef.current && current) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  }, [current]);

  if (loading || !current) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center h-[calc(100vh-140px)]">
        <div className="w-full h-full md:h-[min(660px,calc(100vh-150px))] md:w-auto md:aspect-[9/16] bg-[#131313] border border-white/10 rounded-none md:rounded-3xl animate-pulse flex items-center justify-center text-xs text-[#c5c9b2]">
          Loading pitch preview...
        </div>
      </div>
    );
  }

  const aspectRatioClass = current.videoFormat === '16:9' ? 'md:aspect-video' : 'md:aspect-[9/16]';

  return (
    <div className="max-w-4xl mx-auto flex flex-col justify-between h-[calc(100vh-4rem)] md:h-[calc(100vh-140px)] font-sans pb-0 md:pb-4 relative overflow-hidden">
      
      {/* Top Navigation / Back Bar */}
      <div className="flex items-center justify-between py-2 px-4 md:px-0 z-30 shrink-0">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white transition-all shadow-md active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#ccf063]" /> Back to Pitch Setup
        </button>
        
        <span className="text-[11px] text-[#ccf063] bg-[#ccf063]/10 border border-[#ccf063]/30 px-2.5 py-1 rounded-full font-mono font-extrabold uppercase tracking-wider">
          <span className="hidden sm:inline">Investor </span>Preview
        </span>
      </div>

      {/* Centered Discovery Area */}
      <div className="flex-1 flex items-center justify-center relative py-0 md:py-4 h-full">
        
        {/* Main Card View & Desktop Split Layout */}
        <div className="flex md:flex-row flex-col items-center gap-6 relative w-full h-full md:w-auto md:h-auto justify-center md:max-w-6xl">
          
          {/* Desktop Left Info Panel */}
          <div className="hidden md:flex flex-col w-[320px] bg-[#111111] p-6 rounded-3xl border border-white/5 shadow-2xl self-end mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full overflow-hidden border border-[#ccf063]/30">
                <img src={current.avatar} alt={current.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-1.5 font-serif group-hover:text-[#ccf063] transition-colors">
                  {current.name} <CheckCircle2 className="w-4 h-4 text-[#ccf063] fill-black shrink-0" />
                </h3>
                <p className="text-xs text-[#c5c9b2]">{current.location} • {current.category}</p>
              </div>
            </div>
            
            <p className="text-sm font-medium text-white/90 leading-relaxed mb-6">
              {current.tagline}
            </p>

            <button 
              onClick={() => setShowDetailsSheet(true)}
              className="w-full py-3 bg-[#ccf063] hover:bg-[#b8da54] text-black font-extrabold rounded-xl text-xs transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sliders className="w-4 h-4" /> View Full Specs & Financials
            </button>
          </div>

          {/* Video Card Container */}
          <div
            ref={cardRef}
            onClick={() => togglePlay()}
            className={`w-full h-full ${current.videoFormat === '16:9' ? 'md:w-[min(800px,calc(100vw-380px))] md:h-auto md:max-h-[min(660px,calc(100vh-150px))]' : 'md:h-[min(660px,calc(100vh-150px))] md:w-auto md:max-w-[calc(100vw-380px)]'} ${aspectRatioClass} bg-black md:border md:border-white/10 rounded-none md:rounded-3xl overflow-hidden shadow-2xl relative flex flex-col justify-between p-5 cursor-pointer transition-all duration-300 shrink-0`}
          >
            {/* Background HTML5 Video player */}
            <div className="absolute inset-0 z-0 select-none pointer-events-none">
              <div className="w-full h-full bg-gradient-to-t from-black/90 via-black/30 to-black/60 absolute inset-0 z-10" />
              <video
                ref={videoRef}
                className="w-full h-full object-cover opacity-75"
                src={current.videoUrl}
                autoPlay
                loop
                muted={isMuted}
                playsInline
              />
            </div>

            {/* Play/Pause Button centered */}
            <div className="absolute inset-0 flex items-center justify-center z-15">
              <button
                onClick={(e) => togglePlay(e)}
                className="w-16 h-16 bg-black/50 hover:bg-black/70 border border-white/20 hover:border-[#ccf063] text-white rounded-full flex items-center justify-center shadow-2xl backdrop-blur-md transition-all active:scale-95 pointer-events-auto group"
                title={isPlaying ? "Pause Video" : "Play Video"}
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 text-[#ccf063] fill-[#ccf063] group-hover:scale-110 transition-transform" />
                ) : (
                  <Play className="w-6 h-6 text-[#ccf063] fill-[#ccf063] ml-1 group-hover:scale-110 transition-transform" />
                )}
              </button>
            </div>

            {/* Captions Overlay */}
            {showCaptions && isPlaying && (
              <div className="absolute bottom-36 left-0 right-0 z-15 px-6 flex justify-center pointer-events-none md:bottom-20 md:pr-24">
                <div className="bg-black/80 backdrop-blur-md px-4 py-3 rounded-xl text-white/95 text-xs md:text-sm font-medium w-full max-w-[90%] text-center border border-white/10 shadow-xl flex flex-col gap-1">
                  <span className="text-xs text-[#ccf063] uppercase tracking-wider font-bold">AI Translated Captions (Multi-language)</span>
                  <span>{current.aiSummary}</span>
                </div>
              </div>
            )}
            
            {/* Top Right Controls (Match, Captions, Mute/Unmute) */}
            <div className="absolute top-4 right-4 z-20 flex gap-2 items-center">
              <div className="bg-[#ccf063] text-black px-3 py-1.5 rounded-full text-xs font-extrabold shadow-lg backdrop-blur-md flex items-center gap-1.5 border border-[#ccf063]">
                <div className="w-2 h-2 rounded-full bg-black animate-pulse" />
                {current.match} Match
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); setShowCaptions(!showCaptions); }}
                className={`w-9 h-9 rounded-full backdrop-blur-md border border-white/10 flex items-center justify-center transition-all shadow-md active:scale-90 ${showCaptions ? 'bg-[#ccf063] text-black' : 'bg-black/50 text-white'}`}
                title={showCaptions ? "Hide Captions" : "Show Captions"}
              >
                <Subtitles className="w-4 h-4" />
              </button>
              <button 
                onClick={(e) => toggleMute(e)}
                className={`w-9 h-9 rounded-full backdrop-blur-md border border-white/10 flex items-center justify-center transition-all shadow-md active:scale-90 ${!isMuted ? 'bg-[#ccf063] text-black' : 'bg-black/50 text-white'}`}
                title={isMuted ? "Unmute Sound" : "Mute Sound"}
              >
                {!isMuted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>

            {/* Right Floating Actions Stack inside Card */}
            <div className="absolute right-4 bottom-24 z-20 flex flex-col gap-3.5 text-center items-center">
              <div className="flex flex-col items-center opacity-50 cursor-not-allowed">
                <button className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white shadow-md">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </button>
                <span className="text-[10px] text-white mt-1 font-bold">Shortlist</span>
              </div>

              <div className="flex flex-col items-center opacity-50 cursor-not-allowed">
                <button className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white shadow-md">
                  <Bookmark className="w-4 h-4 text-white" />
                </button>
                <span className="text-[10px] text-white mt-1 font-bold">Save</span>
              </div>

              {current.pitchDeckUrl && current.pitchDeckUrl !== "#" && (
                <div className="flex flex-col items-center">
                  <a 
                    href={current.pitchDeckUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="w-10 h-10 rounded-full bg-[#ccf063] text-black flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
                    title="View Pitch Deck PDF"
                  >
                    <FileText className="w-4 h-4 text-black" />
                  </a>
                  <span className="text-[10px] text-[#ccf063] mt-1 font-bold">Deck</span>
                </div>
              )}

              <div className="flex flex-col items-center">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDetailsSheet(true);
                  }}
                  className="w-10 h-10 rounded-full bg-black/60 hover:bg-[#ccf063] hover:text-black text-white border border-white/10 flex items-center justify-center shadow-lg transition-all active:scale-90"
                  title="Full Specs & Financials"
                >
                  <Sliders className="w-4 h-4" />
                </button>
                <span className="text-[10px] text-white mt-1 font-bold">Specs</span>
              </div>

              <div className="flex flex-col items-center opacity-50 cursor-not-allowed">
                <button className="w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center shadow-md">
                  <Mail className="w-4 h-4 text-white" />
                </button>
                <span className="text-[10px] text-white mt-1 font-bold">Chat</span>
              </div>
            </div>

            {/* Bottom Mobile Section Overlay */}
            <div 
              onClick={(e) => {
                e.stopPropagation();
                setShowDetailsSheet(true);
              }}
              className="relative z-20 space-y-2 select-none group pr-16 md:hidden cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-1.5 font-serif group-hover:text-[#ccf063] transition-colors">
                  {current.name} <CheckCircle2 className="w-4 h-4 text-[#ccf063] fill-black shrink-0" />
                </h3>
              </div>

              <p className="text-xs font-medium text-white/90 leading-relaxed max-w-sm line-clamp-2">
                {current.tagline}
              </p>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetailsSheet(true);
                }}
                className="mt-2 text-xs font-bold text-[#ccf063] flex items-center gap-1 hover:underline"
              >
                View Full Specs & Financials <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Details Modal (Fixed Full Screen Overlay) */}
            {showDetailsSheet && (
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetailsSheet(false);
                }}
                className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 transition-all duration-300 animate-in fade-in flex items-center justify-center p-4 md:p-6"
              >
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-[#121212] border border-white/10 rounded-3xl p-6 md:p-8 z-50 shadow-2xl animate-in zoom-in-95 duration-200 text-left"
                >
                  <div className="flex justify-between items-center mb-5 pb-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden border border-[#ccf063]/30">
                        <img src={current.avatar} alt={current.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white font-serif flex items-center gap-1.5">
                          {current.name} <CheckCircle2 className="w-4 h-4 text-[#ccf063] fill-black shrink-0" />
                        </h3>
                        <p className="text-xs text-[#c5c9b2]">{current.founder} &bull; {current.location} &bull; {current.category}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowDetailsSheet(false)}
                      className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Pitch Deck PDF Link */}
                  {current.pitchDeckUrl && current.pitchDeckUrl !== "#" && (
                    <div className="mb-5 p-4 bg-[#ccf063]/10 border border-[#ccf063]/30 rounded-2xl flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-3">
                        <FileText className="w-6 h-6 text-[#ccf063]" />
                        <div>
                          <span className="text-xs font-bold text-[#ccf063] block">Pitch Deck PDF Verified</span>
                          <span className="text-[10px] text-white/60">Official investor presentation deck</span>
                        </div>
                      </div>
                      <a 
                        href={current.pitchDeckUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 bg-[#ccf063] hover:bg-[#b8da54] text-black font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                      >
                        View Deck <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}

                  {/* Financials & Terms Grid */}
                  <h4 className="text-xs font-bold text-[#ccf063] uppercase tracking-wider mb-3">Financials & Round Terms</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 text-xs mb-6">
                    <div className="bg-white/5 p-3.5 rounded-2xl border border-white/5">
                      <span className="text-white/40 block mb-1 text-[10px] uppercase tracking-wider">Funding Ask</span>
                      <span className="font-extrabold text-[#ccf063] text-base">{current.targetAmount}</span>
                    </div>
                    <div className="bg-white/5 p-3.5 rounded-2xl border border-white/5">
                      <span className="text-white/40 block mb-1 text-[10px] uppercase tracking-wider">Valuation Cap</span>
                      <span className="font-extrabold text-white text-base">{current.valuation}</span>
                    </div>
                    <div className="bg-white/5 p-3.5 rounded-2xl border border-white/5">
                      <span className="text-white/40 block mb-1 text-[10px] uppercase tracking-wider">Round Type</span>
                      <span className="font-bold text-white text-sm">{current.roundType}</span>
                    </div>
                    <div className="bg-white/5 p-3.5 rounded-2xl border border-white/5">
                      <span className="text-white/40 block mb-1 text-[10px] uppercase tracking-wider">Min Ticket</span>
                      <span className="font-bold text-white text-sm">{current.minTicket}</span>
                    </div>
                    <div className="bg-white/5 p-3.5 rounded-2xl border border-white/5">
                      <span className="text-white/40 block mb-1 text-[10px] uppercase tracking-wider">Equity Offered</span>
                      <span className="font-bold text-white text-sm">{current.equityOffered}</span>
                    </div>
                    <div className="bg-white/5 p-3.5 rounded-2xl border border-white/5">
                      <span className="text-white/40 block mb-1 text-[10px] uppercase tracking-wider">Stage</span>
                      <span className="font-bold text-white text-sm">{current.stage}</span>
                    </div>
                  </div>

                  {/* Problem & Solution Narrative */}
                  <div className="space-y-4 mb-6">
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-400" /> Core Problem
                      </h4>
                      <p className="text-xs text-white/90 leading-relaxed bg-white/5 p-3.5 rounded-2xl border border-white/5 whitespace-pre-wrap">
                        {current.problemText}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" /> Proposed Solution
                      </h4>
                      <p className="text-xs text-white/90 leading-relaxed bg-white/5 p-3.5 rounded-2xl border border-white/5 whitespace-pre-wrap">
                        {current.solutionText}
                      </p>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex justify-between items-center pt-4 border-t border-white/10 text-xs">
                    <span className="text-[#c5c9b2]"><strong className="text-white">TAM:</strong> {current.tam}</span>
                    <div className="flex gap-2">
                      <Link 
                        href={`/investor/diligence?ids=${current.id}`} 
                        className="px-4 py-2 bg-[#ccf063] hover:bg-[#b8da54] text-black font-extrabold rounded-xl transition-all shadow-md flex items-center gap-1"
                      >
                        Run AI Diligence Agent <ArrowUpRight className="w-4 h-4" />
                      </Link>
                      <button 
                        onClick={() => setShowDetailsSheet(false)}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        Close Specs
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Desktop Right Action Panel */}
          <div className="hidden md:flex flex-col gap-2.5 text-xs select-none">
            <div className="flex flex-col items-center opacity-50 cursor-not-allowed">
              <button className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#c5c9b2] transition-all shadow-md">
                <CheckCircle2 className="w-4 h-4" />
              </button>
              <span className="text-[10px] text-[#c5c9b2] mt-0.5 font-bold uppercase">Shortlist</span>
            </div>

            <div className="flex flex-col items-center opacity-50 cursor-not-allowed">
              <button className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#c5c9b2] transition-all shadow-md">
                <Bookmark className="w-4 h-4" />
              </button>
              <span className="text-[10px] text-[#c5c9b2] mt-0.5 font-bold uppercase">Save</span>
            </div>

            {current.pitchDeckUrl && current.pitchDeckUrl !== "#" ? (
              <div className="flex flex-col items-center">
                <a 
                  href={current.pitchDeckUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-xl bg-[#ccf063] text-black flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
                  title="View Pitch Deck PDF"
                >
                  <FileText className="w-4 h-4 text-black" />
                </a>
                <span className="text-[10px] text-[#ccf063] mt-0.5 font-bold uppercase">Deck</span>
              </div>
            ) : (
              <div className="flex flex-col items-center opacity-50 cursor-not-allowed">
                <button className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#c5c9b2]">
                  <FileText className="w-4 h-4" />
                </button>
                <span className="text-[10px] text-[#c5c9b2] mt-0.5 font-bold">Deck</span>
              </div>
            )}

            <div className="flex flex-col items-center opacity-50 cursor-not-allowed">
              <button className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white flex items-center justify-center shadow-md">
                <Mail className="w-4 h-4" />
              </button>
              <span className="text-[10px] text-white/80 mt-0.5 font-bold">Chat</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

export default function StartupPitchPreviewPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh] text-[#c5c9b2]">Loading pitch preview...</div>}>
      <PitchPreviewContent />
    </Suspense>
  );
}
