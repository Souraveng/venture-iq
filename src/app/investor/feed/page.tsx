"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import {
  Heart,
  Bookmark,
  FileText,
  Calendar,
  Mail,
  Share2,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Play,
  Pause,
  CheckCircle2,
  ArrowUpRight,
  Sliders,
  ClosedCaption,
  Subtitles,
  X,
  Volume2,
  VolumeX,
  Sparkles
} from "lucide-react";
import { PitchDetails, RequestDealButton } from "@/components/PitchDetails";
import { useAuth } from "@/context/AuthContext";
import WorkspaceSwitcher from "@/components/investor/WorkspaceSwitcher";

export default function StartupDiscoveryFeedReplicatedPage() {
  const router = useRouter();
  const { userEmail, activeInvestorTeam } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [showDetailsSheet, setShowDetailsSheet] = useState(false);
  const [showFullSpecs, setShowFullSpecs] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [startups, setStartups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCaptions, setShowCaptions] = useState(false);
  const [autonomousRecommendation, setAutonomousRecommendation] = useState<any>(null);

  const touchStartY = useRef(0);
  const touchEndY = useRef(0);
  const lastTouchTime = useRef(0);
  const lastScrollTime = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.targetTouches[0].clientY;
    touchEndY.current = e.targetTouches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndY.current = e.targetTouches[0].clientY;
  };

  const handleTouchEnd = () => {
    const now = Date.now();
    if (now - lastTouchTime.current < 600) return;
    const deltaY = touchStartY.current - touchEndY.current;
    if (Math.abs(deltaY) > 40) {
      lastTouchTime.current = now;
      if (deltaY > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
  };

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest(".venture-profile-box") || target.closest(".custom-scrollbar")) {
        return;
      }
      const now = Date.now();
      if (now - lastScrollTime.current < 800) return;
      if (Math.abs(e.deltaY) > 30) {
        lastScrollTime.current = now;
        if (e.deltaY > 0) {
          handleNext();
        } else {
          handlePrev();
        }
      }
    };
    window.addEventListener("wheel", handleWheel, { passive: true });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [startups.length]);

  const [fetchError, setFetchError] = useState<string | null>(null);

  const loadFeed = () => {
    setLoading(true);
    setFetchError(null);
    fetch("/api/matchmaking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ investorEmail: userEmail }) 
    })
      .then((res) => res.json())
      .then((json: any) => {
        if (json.success && Array.isArray(json.data)) {
          const formatted = json.data.map((item: any) => ({
            id: item.id,
            name: item.name,
            founder: item.founder || "Founder",
            match: `${Math.round(item.matchScore || 85)}%`,
            tagline: item.tagline,
            tags: [item.category, item.stage].filter(Boolean),
            arr: item.arrMrr ? `$${item.arrMrr}k MRR` : (item.traction || "$10k MRR"),
            goal: item.targetAmount || "$500k",
            growth: `+${Math.floor(Math.random() * 80) + 80}%`,
            aiScore: `${((item.matchScore || 85) / 10).toFixed(1)}/10`,
            tam: item.valuation ? `${item.valuation} Val` : "$10M Val",
            avatar: item.founderProfile?.avatarUrl || "",
            videoUrl: item.founderProfile?.introVideoUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
            aiSummary: item.aiSummary || "This founder matches your core investment thesis across stage and sector.",
            rawStartup: item
          }));
          setStartups(formatted);
        } else {
          setFetchError(json.error || "Unable to connect to Vertex AI Matchmaker service.");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load startups:", err);
        setFetchError("Network connection error: Unable to reach AI Matchmaker.");
        setLoading(false);
      });
  };

  const cardStartTime = useRef<number>(Date.now());
  const video10sTriggered = useRef<boolean>(false);

  const trackActivityEvent = (startupId: string, eventType: string, metadata?: any) => {
    if (!startupId || !userEmail) return;
    try {
      fetch("/api/interactions/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startupId,
          investorEmail: userEmail,
          eventType,
          metadata,
        }),
      }).catch(() => {});
    } catch (e) {
      // Non-blocking telemetry
    }
  };

  useEffect(() => {
    loadFeed();
  }, []);

  const trackEvent = async (eventType: string, targetStartupId?: string) => {
    const sId = targetStartupId || current?.id;
    if (!sId) return;
    try {
      await fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startupId: sId,
          eventType,
          investorEmail: userEmail,
        }),
      });
    } catch (err) {
      console.error("Failed to track event:", eventType, err);
    }
  };

  // Track feed impression on startup load/index change
  useEffect(() => {
    if (startups.length > 0 && startups[currentIndex]) {
      trackEvent("FEED_IMPRESSION", startups[currentIndex].id);
    }
  }, [currentIndex, startups.length]);

  // Track details sheet opens (mobile view)
  useEffect(() => {
    if (showDetailsSheet && current) {
      trackEvent("PROFILE_VIEW", current.id);
    }
  }, [showDetailsSheet]);

  useEffect(() => {
    // Record dwell time of previous card before resetting timer
    const prevStartup = startups[currentIndex];
    const now = Date.now();
    const elapsed = now - cardStartTime.current;

    if (prevStartup && elapsed > 500) {
      if (elapsed < 3000) {
        trackActivityEvent(prevStartup.id, "SKIP_FAST", { dwellDurationSec: Math.round(elapsed / 100) / 10 });
      } else if (elapsed > 15000) {
        trackActivityEvent(prevStartup.id, "DWELL_HIGH", { dwellDurationSec: Math.round(elapsed / 100) / 10 });
      }
    }

    cardStartTime.current = Date.now();
    video10sTriggered.current = false;

    // Force auto-play state when index changes
    setIsPlaying(true);
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play()
        .then(() => {
          if (current) trackEvent("VIDEO_VIEW", current.id);
        })
        .catch(() => {});
    }
  }, [currentIndex]);

  const handleVideoTimeUpdate = () => {
    if (videoRef.current && current && !video10sTriggered.current) {
      if (videoRef.current.currentTime >= 10) {
        video10sTriggered.current = true;
        trackActivityEvent(current.id, "VIDEO_WATCHED_10S", { watchDurationSec: 10 });
      }
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play()
          .then(() => {
            if (current) trackEvent("VIDEO_VIEW", current.id);
          })
          .catch(() => {});
      }
      setIsPlaying(!isPlaying);
    }
  };
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const showToastNotification = (msg: string, type: "success" | "error" = "success") => {
    setNotification({ message: msg, type });
    // Auto-dismiss after 3 seconds
    const timer = setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const handleChatClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!current) return;
    try {
      const res = await fetch("/api/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startupId: current.id, action: "request_intro", investorEmail: userEmail }),
      });
      const json = (await res.json()) as any;
      if (json.success) {
        showToastNotification(`Deal request for "${current.name}" sent successfully!`);
        if (showFullSpecs) {
          fetchProfileData(current.id);
        }
      }
    } catch (err) {
      console.error("Failed to send deal request via chat button:", err);
      showToastNotification("Failed to send deal request.", "error");
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("a") || target.closest(".z-20") || target.closest(".z-45")) {
      return;
    }
    if (showDetailsSheet) {
      setShowDetailsSheet(false);
    } else {
      togglePlay();
    }
  };

  const handleNext = () => {
    if (currentIndex === startups.length - 1) {
      // Refresh feed when scrolling down past the last startup
      showToastNotification("Loading fresh startups...", "success");
      loadFeed();
      setCurrentIndex(0);
      return;
    }
    setCurrentIndex((prev) => (prev + 1) % startups.length);
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { scale: 0.95, opacity: 0.7, y: 15 },
        { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
      );
    }
  };

  const handlePrev = () => {
    if (currentIndex === 0) {
      // Refresh feed when pulling down on the first startup
      showToastNotification("Refreshing feed...", "success");
      loadFeed();
      return;
    }
    setCurrentIndex((prev) => (prev - 1 + startups.length) % startups.length);
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { scale: 0.95, opacity: 0.7, y: -15 },
        { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
      );
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (current) {
      showToastNotification(`"${current.name}" added to Shortlisted Deals!`);
      try {
        await fetch('/api/interactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            startupId: current.id,
            action: 'shortlist',
            investorEmail: userEmail,
            teamId: activeInvestorTeam?.id
          })
        });
      } catch (e) {
        console.error("Failed to shortlist", e);
        showToastNotification("Failed to shortlist startup.", "error");
      }
    }
    
    setTimeout(() => {
      handleNext();
    }, 600);
  };

  const handlePass = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (current) {
      const startupName = current.name;
      const startupId = current.id;
      showToastNotification(`Passed on "${startupName}". Preferences optimized.`, "error");

      try {
        fetch('/api/interactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            startupId,
            action: 'pass',
            investorEmail: userEmail,
            teamId: activeInvestorTeam?.id
          })
        }).catch(() => {});
      } catch (e) {
        console.error("Failed to register pass interaction", e);
      }

      setStartups((prev) => prev.filter((s) => s.id !== startupId));
    }
  };

  const current = startups[currentIndex];

  const fetchProfileData = async (startupId: string) => {
    setLoadingProfile(true);
    try {
      const res = await fetch(`/api/startups?id=${startupId}`);
      const json = (await res.json()) as any;
      if (json.success) {
        setProfileData(json.data);
      } else {
        setProfileData(null);
      }
    } catch (e) {
      console.error(e);
      setProfileData(null);
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    if (showFullSpecs && current) {
      fetchProfileData(current.id);
      trackEvent("PROFILE_VIEW", current.id);
    }
  }, [currentIndex, showFullSpecs]);

  if (fetchError) {
    return (
      <div className="max-w-md mx-auto my-auto flex flex-col items-center justify-center min-h-[calc(100vh-140px)] p-6">
        <div className="w-full bg-[#131313] border border-red-500/30 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
            <X className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white font-serif">AI Matchmaker Offline / Error</h3>
          <p className="text-xs text-red-200/80 leading-relaxed font-sans">{fetchError}</p>
          <button 
            onClick={() => loadFeed()} 
            className="px-6 py-2.5 bg-[#ccf063] hover:bg-[#b8db52] text-black font-bold text-xs rounded-xl shadow-lg shadow-[#ccf063]/10 transition-all active:scale-95 cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-140px)] font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#ccf063] border-t-transparent animate-spin" />
          <p className="text-xs text-[#c5c9b2] animate-pulse font-mono tracking-wider uppercase">
            Loading Live Deals...
          </p>
        </div>
      </div>
    );
  }

  if (startups.length === 0 || !current) {
    return (
      <div className="max-w-md mx-auto my-auto flex flex-col items-center justify-center min-h-[calc(100vh-140px)] p-6">
        <div className="w-full bg-[#131313] border border-white/10 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-[#ccf063]/10 border border-[#ccf063]/30 flex items-center justify-center mx-auto text-[#ccf063]">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white font-serif">All Caught Up!</h3>
          <p className="text-xs text-[#c5c9b2] leading-relaxed font-sans">
            You have reviewed all active startups matching your thesis. New startup deals will appear automatically as founders publish.
          </p>
          <button 
            onClick={() => loadFeed()} 
            className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/10 transition-all active:scale-95 cursor-pointer"
          >
            Refresh Feed
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div 
        className={`mx-auto flex flex-col justify-between h-[calc(100vh-4rem)] md:h-[calc(100vh-140px)] font-sans pb-0 md:pb-4 relative transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          showFullSpecs ? "max-w-6xl xl:max-w-7xl w-full" : "max-w-6xl w-full"
        }`}
      >

      {/* Top Workspace Switcher Anchor */}
      <div className="hidden md:flex items-center justify-between px-4 pt-1 pb-2 z-30">
        <WorkspaceSwitcher compact />
      </div>
      
      {/* Centered Discovery Area */}
      <div className="flex-1 flex items-center justify-center relative py-0 md:py-4 h-full">
        
        {/* Main Card View */}
        <div className="relative flex items-center justify-center w-full h-full md:w-auto md:h-auto">
          
          {/* Left Side Controls & Details (Desktop Only - positioned to the left of the centered reel box) */}
          <div className="hidden md:flex items-center gap-6 md:absolute md:right-[calc(100%+1.5rem)] md:top-1/2 md:-translate-y-1/2 select-none z-20">
            {/* Desktop Vertical Navigation Stack (Left side of card) */}
            <div className="flex flex-col items-center gap-4 select-none">
              <button
                onClick={handlePrev}
                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-white flex items-center justify-center border border-white/10 active:scale-95 transition-all"
                title="Previous Startup"
              >
                <ChevronUp className="w-5 h-5" />
              </button>

              {/* Vertical Page Dots indicators */}
              <div className="flex flex-col gap-2">
                {startups.map((_, idx) => (
                  <span
                    key={idx}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      currentIndex === idx ? "bg-[#ccf063] scale-125 h-3" : "bg-white/20"
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={handleNext}
                className="w-10 h-10 rounded-xl bg-[#ccf063] text-black flex items-center justify-center shadow-md shadow-[#ccf063]/10 active:scale-95 transition-all"
                title="Next Startup"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>

            {/* Left Venture Details Card (Desktop Only) */}
            <div 
              onClick={() => setShowDetailsSheet(!showDetailsSheet)}
              className="flex flex-col w-[220px] bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl p-4.5 text-left transition-all hover:border-[#ccf063]/50 cursor-pointer select-none space-y-3.5 self-center max-h-[min(660px,calc(100vh-150px))] overflow-y-auto custom-scrollbar shrink-0"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full overflow-hidden border border-[#ccf063]/50 shrink-0">
                  {current.avatar ? <img src={current.avatar} alt={current.name} className="w-full h-full object-cover" /> : <span className="w-full h-full flex items-center justify-center text-[#ccf063] font-bold">{current.name?.slice(0, 1).toUpperCase() || "?"}</span>}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1 font-serif truncate">
                    {current.name} <CheckCircle2 className="w-3 h-3 text-[#ccf063] fill-black shrink-0" />
                  </h3>
                  <span className="text-[9px] text-[#c5c9b2] block truncate">{current.founder}</span>
                </div>
              </div>

              <p className="text-[10px] font-semibold text-white/95 leading-relaxed line-clamp-3">
                {current.tagline}
              </p>

              <div className="flex flex-wrap gap-1">
                {current.tags.map((tag: any) => (
                  <span
                    key={tag}
                    className="bg-black/60 border border-white/10 px-2 py-0.5 rounded-full text-[8px] font-bold text-white uppercase tracking-wider"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Metrics Grid showing when expanded/clicked */}
              {showDetailsSheet && (
                <div className="pt-3.5 border-t border-white/10 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300 z-20 relative">
                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="bg-white/5 p-2 rounded-lg border border-white/5 flex flex-col justify-between">
                      <span className="text-[8px] text-[#c5c9b2] uppercase tracking-wider block font-semibold mb-0.5">Revenue</span>
                      <span className="font-extrabold text-[#ccf063] text-[10px] truncate">{current.arr}</span>
                    </div>
                    <div className="bg-white/5 p-2 rounded-lg border border-white/5 flex flex-col justify-between">
                      <span className="text-[8px] text-[#c5c9b2] uppercase tracking-wider block font-semibold mb-0.5">Goal</span>
                      <span className="font-extrabold text-[#ccf063] text-[10px] truncate">{current.goal}</span>
                    </div>
                    <div className="bg-white/5 p-2 rounded-lg border border-white/5 flex flex-col justify-between">
                      <span className="text-[8px] text-[#c5c9b2] uppercase tracking-wider block font-semibold mb-0.5">Growth</span>
                      <span className="font-extrabold text-[#ccf063] text-[10px] truncate">{current.growth}</span>
                    </div>
                    <div className="bg-white/5 p-2 rounded-lg border border-white/5 flex flex-col justify-between">
                      <span className="text-[8px] text-[#c5c9b2] uppercase tracking-wider block font-semibold mb-0.5">AI Score</span>
                      <span className="font-extrabold text-[#ccf063] text-[10px] truncate">{current.aiScore}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[9px] text-[#c5c9b2]/60 pt-2 border-t border-white/5">
                    <span className="truncate">TAM: {current.tam}</span>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setShowDetailsSheet(false); 
                        setShowFullSpecs(true); 
                      }}
                      className="text-[#ccf063] font-bold flex items-center gap-0.5 hover:underline cursor-pointer"
                    >
                      Specs <ArrowUpRight className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Replicated Card */}
          <div
            ref={cardRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={handleCardClick}
            className="group w-full h-full md:h-[min(660px,calc(100vh-150px))] md:w-auto md:aspect-[9/16] bg-black md:border md:border-white/10 rounded-none md:rounded-3xl overflow-hidden shadow-2xl relative flex flex-col justify-between p-5 cursor-pointer shrink-0"
          >
            {/* Background HTML5 Video player */}
            <div className="absolute inset-0 z-0 select-none pointer-events-none">
              <div className="w-full h-full bg-gradient-to-t from-black/90 via-black/10 to-transparent absolute inset-0 z-10" />
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                src={current.videoUrl}
                autoPlay
                loop
                playsInline
                muted={isMuted}
                onTimeUpdate={handleVideoTimeUpdate}
              />
            </div>

            {/* Center Controls Overlay (Mute, Play/Pause, Captions) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center z-15 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <div className="flex flex-col items-center gap-4 pointer-events-auto">
                {/* Mute/Unmute Button (Above, smaller) */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                  className="w-10 h-10 bg-black/40 hover:bg-black/60 border border-white/20 hover:border-[#ccf063]/50 text-white rounded-full flex items-center justify-center shadow-2xl backdrop-blur-md transition-all active:scale-95 group cursor-pointer"
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4 text-[#ccf063] group-hover:scale-105 transition-transform" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-[#ccf063] group-hover:scale-105 transition-transform" />
                  )}
                </button>

                {/* Play/Pause Button (Center) */}
                <button
                  onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                  className="w-14 h-14 bg-black/40 hover:bg-black/60 border border-white/20 hover:border-[#ccf063]/50 text-white rounded-full flex items-center justify-center shadow-2xl backdrop-blur-md transition-all active:scale-95 group cursor-pointer"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 text-[#ccf063] fill-[#ccf063] group-hover:scale-105 transition-transform" />
                  ) : (
                    <Play className="w-5 h-5 text-[#ccf063] fill-[#ccf063] ml-0.5 group-hover:scale-105 transition-transform" />
                  )}
                </button>

                {/* Captions Button (Below) */}
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowCaptions(!showCaptions); }}
                  className={`w-10 h-10 rounded-full border border-white/10 flex items-center justify-center transition-all shadow-md active:scale-95 backdrop-blur-md cursor-pointer ${
                    showCaptions 
                      ? 'bg-[#ccf063] text-black border-[#ccf063]' 
                      : 'bg-black/40 text-white hover:bg-black/60 hover:border-[#ccf063]/50 group'
                  }`}
                  title="Toggle Captions"
                >
                  <Subtitles className={`w-4 h-4 ${showCaptions ? 'text-black' : 'text-[#ccf063]'}`} />
                </button>
              </div>
            </div>

            {/* Captions Overlay */}
            {showCaptions && isPlaying && (
              <div className="absolute bottom-40 left-0 right-0 z-15 px-6 flex justify-center pointer-events-none md:bottom-20 md:pr-24">
                <div className="bg-black/70 backdrop-blur-md px-4 py-2 rounded-lg text-white/95 text-sm md:text-base font-medium max-w-sm text-center border border-white/10 shadow-lg">
                  {current.aiSummary}
                </div>
              </div>
            )}



             {/* Right Floating Actions Stack inside Card */}
            <div className="absolute right-4 bottom-24 z-20 flex flex-col gap-3 text-center items-center md:hidden">
              {/* Pass / Not Interested */}
              <div className="flex flex-col items-center">
                <button
                  onClick={handlePass}
                  className="w-10 h-10 rounded-full bg-black/45 backdrop-blur-md border border-red-500/20 flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-all shadow-md active:scale-90"
                  title="Pass / Not Interested"
                >
                  <X className="w-4 h-4" />
                </button>
                <span className="text-[9px] text-red-400/90 mt-0.5 font-bold shadow-sm">Pass</span>
              </div>

              {/* Interested / Shortlist */}
              <div className="flex flex-col items-center">
                <button
                  onClick={handleLike}
                  className="w-10 h-10 rounded-full bg-[#ccf063]/20 backdrop-blur-md border border-[#ccf063]/40 flex items-center justify-center text-[#ccf063] hover:bg-[#ccf063]/30 transition-all shadow-md active:scale-90"
                  title="Interested / Shortlist"
                >
                  <CheckCircle2 className="w-4.5 h-4.5 text-[#ccf063]" />
                </button>
                <span className="text-[9px] text-[#ccf063] mt-0.5 font-bold shadow-sm">Interested</span>
              </div>

              {/* Deck (opens Venture Specs) */}
              <div className="flex flex-col items-center">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    trackActivityEvent(current.id, "VIEW_DECK");
                    setShowFullSpecs(true);
                  }}
                  className="w-10 h-10 rounded-full bg-black/45 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:text-[#ccf063] hover:bg-black/60 transition-all shadow-md active:scale-90"
                >
                  <FileText className="w-4 h-4 text-white/95" />
                </button>
                <span className="text-[9px] text-white/90 mt-0.5 font-bold shadow-sm">Deck</span>
              </div>

              {/* AI Diligence */}
              <div className="flex flex-col items-center">
                <button 
                  onClick={(e) => { e.stopPropagation(); router.push(`/investor/diligence?ids=${current.id}`); }}
                  className="w-10 h-10 rounded-full bg-black/45 backdrop-blur-md border border-[#ccf063]/30 flex items-center justify-center text-[#ccf063] hover:bg-[#ccf063]/20 transition-all shadow-md shadow-[#ccf063]/10 active:scale-90"
                >
                  <Sparkles className="w-4 h-4" />
                </button>
                <span className="text-[9px] text-[#ccf063] mt-0.5 font-bold shadow-sm">AI Agent</span>
              </div>

              {/* Chat (requests intro / deal) */}
              <div className="flex flex-col items-center">
                <button 
                  onClick={handleChatClick}
                  className="w-10 h-10 rounded-full bg-[#ccf063] text-black flex items-center justify-center hover:scale-105 transition-all shadow-md active:scale-90"
                >
                  <Mail className="w-4 h-4 text-black" />
                </button>
                <span className="text-[9px] text-white/90 mt-0.5 font-bold shadow-sm">Chat</span>
              </div>
            </div>
            {/* Bottom Section Overlay details (Mobile Only) */}
            <div 
              onClick={(e) => {
                e.stopPropagation();
                setShowDetailsSheet(true);
              }}
              className="relative z-20 space-y-3 select-none group pr-16 md:pr-0 cursor-pointer mt-auto md:hidden"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#ccf063]/50 shrink-0">
                  {current.avatar ? <img src={current.avatar} alt={current.name} className="w-full h-full object-cover" /> : <span className="w-full h-full flex items-center justify-center text-[#ccf063] font-bold">{current.name?.slice(0, 1).toUpperCase() || "?"}</span>}
                </div>
                <div>
                  <h3 className="text-2xl md:text-xl font-bold text-white tracking-tight flex items-center gap-1.5 font-serif group-hover:text-[#ccf063] transition-colors">
                    {current.name} <CheckCircle2 className="w-4 h-4 text-[#ccf063] fill-black shrink-0" />
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-[#c5c9b2]">{current.founder}</span>
                    <span className="text-[10px] font-bold text-[#ccf063] uppercase tracking-wider hidden md:inline"> • Verified</span>
                  </div>
                </div>
              </div>

              {/* Tagline */}
              <p className="text-xs font-semibold text-white/90 leading-relaxed max-w-sm line-clamp-2 md:line-clamp-none">
                {current.tagline}
              </p>

              {/* Category Badges */}
              <div className="flex flex-wrap gap-1.5">
                {current.tags.map((tag: any) => (
                  <span
                    key={tag}
                    className="bg-black/60 backdrop-blur-sm border border-white/10 px-2.5 py-0.5 rounded-full text-[9px] font-bold text-white uppercase tracking-wider"
                  >
                    {tag}
                  </span>
                ))}
              </div>

            </div>

            {/* Details Slide-Up Drawer (Rendered INSIDE overflow-hidden card - Mobile Only) */}
            {showDetailsSheet && (
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetailsSheet(false);
                }}
                className="absolute inset-0 bg-black/70 backdrop-blur-sm z-30 transition-all duration-300 animate-in fade-in md:hidden"
              />
            )}
            <div
              className={`absolute bottom-0 left-0 right-0 bg-[#0e0e0e]/95 backdrop-blur-xl border-t border-white/10 rounded-t-3xl p-6 z-40 transition-transform duration-300 ease-out transform md:hidden ${
                showDetailsSheet ? "translate-y-0" : "translate-y-full"
              }`}
            >
              <div className="w-12 h-1 bg-white/25 rounded-full mx-auto mb-6 cursor-pointer" onClick={(e) => { e.stopPropagation(); setShowDetailsSheet(false); }} />
              
              <div className="flex justify-between items-start mb-5">
                <div>
                  <h3 className="text-xl font-bold text-white font-serif">{current.name}</h3>
                  <p className="text-xs text-[#c5c9b2] mt-0.5">{current.founder}</p>
                </div>
                <div className={`bg-[#ccf063]/10 border border-[#ccf063]/30 text-[#ccf063] rounded-full px-2.5 py-1 text-[10px] font-bold ${current.match === 'AI Offline' ? 'text-white/50 border-white/20 bg-white/5' : ''}`}>
                  {current.match === "AI Offline" ? "AI Offline" : `Match: ${current.match}`}
                </div>
              </div>

              <p className="text-xs text-white/90 leading-relaxed mb-6 bg-white/5 p-3.5 rounded-2xl border border-white/5">
                {current.tagline}
              </p>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-3.5 text-xs mb-6">
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <span className="text-[10px] text-[#c5c9b2] uppercase tracking-wider block font-semibold mb-1">Revenue (ARR)</span>
                  <span className="font-extrabold text-[#ccf063] text-sm">{current.arr}</span>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <span className="text-[10px] text-[#c5c9b2] uppercase tracking-wider block font-semibold mb-1">Funding Goal</span>
                  <span className="font-extrabold text-[#ccf063] text-sm">{current.goal}</span>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <span className="text-[10px] text-[#c5c9b2] uppercase tracking-wider block font-semibold mb-1">Growth (YoY)</span>
                  <span className="font-extrabold text-[#ccf063] text-sm">{current.growth}</span>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <span className="text-[10px] text-[#c5c9b2] uppercase tracking-wider block font-semibold mb-1">AI Score</span>
                  <span className="font-extrabold text-[#ccf063] text-sm">{current.aiScore}</span>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs text-[#c5c9b2]/60 pt-4 border-t border-white/5">
                <span>Market Size: {current.tam}</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowDetailsSheet(false); setShowFullSpecs(true); }}
                  className="text-[#ccf063] font-bold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  Full Specs <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>

          {/* Desktop Side Spec Box / Actions Stack */}
          {showFullSpecs ? (
            <div className="venture-profile-box hidden md:flex flex-col md:absolute md:left-[calc(100%+1.5rem)] md:top-1/2 md:-translate-y-1/2 w-[450px] lg:w-[500px] xl:w-[600px] h-[min(660px,calc(100vh-150px))] bg-[#121212]/95 border border-white/10 rounded-3xl overflow-hidden shadow-2xl z-30">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#121212] shrink-0 z-10 sticky top-0">
                <h2 className="text-sm font-bold text-white font-sans uppercase tracking-wider flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#ccf063]" />
                  Venture Profile
                </h2>
                <button 
                  onClick={() => setShowFullSpecs(false)}
                  className="w-8 h-8 hover:bg-white/10 text-white rounded-full flex items-center justify-center transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto px-6 py-6 scroll-smooth custom-scrollbar pb-4">
                {loadingProfile ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-white/50 text-xs">
                    <div className="w-5 h-5 border-2 border-[#ccf063] border-t-transparent rounded-full animate-spin" />
                    Fetching database profile...
                  </div>
                ) : (
                  profileData && <PitchDetails startup={profileData} />
                )}
              </div>

              {/* Request for Deal Button Footer */}
              {!loadingProfile && profileData && (
                <div className="px-6 py-4 border-t border-white/10 bg-[#121212] shrink-0 z-10">
                  <RequestDealButton startup={profileData} userEmail={userEmail} />
                </div>
              )}
            </div>
          ) : (
            /* Desktop Floating Actions Stack (Rendered outside the card on desktop) */
            <div className="hidden md:flex flex-col gap-2.5 text-xs select-none md:absolute md:left-[calc(100%+1.5rem)] md:top-1/2 md:-translate-y-1/2 z-20">
              {/* Pass / Not Interested */}
              <div className="flex flex-col items-center">
                <button
                  onClick={handlePass}
                  className="w-10 h-10 rounded-xl bg-white/5 border border-red-500/20 flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all shadow-md active:scale-95 cursor-pointer"
                  title="Pass / Not Interested"
                >
                  <X className="w-4 h-4" />
                </button>
                <span className="text-[9px] text-red-400/80 mt-0.5 font-bold uppercase">Pass</span>
              </div>

              {/* Interested / Shortlist */}
              <div className="flex flex-col items-center">
                <button
                  onClick={handleLike}
                  className="w-10 h-10 rounded-xl bg-[#ccf063]/10 border border-[#ccf063]/30 flex items-center justify-center text-[#ccf063] hover:bg-[#ccf063]/20 transition-all shadow-md active:scale-95 cursor-pointer"
                  title="Interested / Shortlist"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#ccf063]" />
                </button>
                <span className="text-[9px] text-[#ccf063] mt-0.5 font-bold uppercase">Interested</span>
              </div>

              {/* Deck (opens Venture Specs) */}
              <div className="flex flex-col items-center">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    trackActivityEvent(current.id, "VIEW_DECK");
                    setShowFullSpecs(true);
                  }}
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#c5c9b2] hover:text-[#ccf063] hover:bg-white/10 transition-all active:scale-95 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                </button>
                <span className="text-[9px] text-[#c5c9b2] mt-0.5 font-bold">Deck</span>
              </div>

              {/* AI Diligence */}
              <div className="flex flex-col items-center">
                <button 
                  onClick={(e) => { e.stopPropagation(); router.push(`/investor/diligence?ids=${current.id}`); }}
                  className="w-10 h-10 rounded-xl bg-[#ccf063]/10 border border-[#ccf063]/30 flex items-center justify-center text-[#ccf063] hover:bg-[#ccf063]/20 transition-all shadow-md shadow-[#ccf063]/5 active:scale-95 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                </button>
                <span className="text-[9px] text-[#ccf063] mt-0.5 font-bold">AI Agent</span>
              </div>

              {/* Chat (requests intro / deal) */}
              <div className="flex flex-col items-center">
                <button 
                  onClick={handleChatClick}
                  className="w-10 h-10 rounded-xl bg-[#ccf063] text-black flex items-center justify-center hover:scale-105 transition-all shadow-md shadow-[#ccf063]/10 active:scale-95 cursor-pointer"
                >
                  <Mail className="w-4 h-4" />
                </button>
                <span className="text-[9px] text-white/80 mt-0.5 font-bold">Chat</span>
              </div>
            </div>
          )}

        </div>

      </div>



      {/* Details Slide-Up Drawer for Mobile */}
      {showDetailsSheet && (
        <div 
          onClick={() => setShowDetailsSheet(false)}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm z-30 transition-all duration-300 animate-in fade-in md:hidden"
        />
      )}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-[#0e0e0e]/95 backdrop-blur-xl border-t border-white/10 rounded-t-3xl p-6 z-40 transition-transform duration-300 ease-out transform md:hidden ${
          showDetailsSheet ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="w-12 h-1 bg-white/25 rounded-full mx-auto mb-6 cursor-pointer" onClick={() => setShowDetailsSheet(false)} />
        
        <div className="flex justify-between items-start mb-5">
          <div>
            <h3 className="text-xl font-bold text-white font-serif">{current.name}</h3>
            <p className="text-xs text-[#c5c9b2] mt-0.5">{current.founder}</p>
          </div>
          <div className={`bg-[#ccf063]/10 border border-[#ccf063]/30 text-[#ccf063] rounded-full px-2.5 py-1 text-[10px] font-bold ${current.match === 'AI Offline' ? 'text-white/50 border-white/20 bg-white/5' : ''}`}>
            {current.match === "AI Offline" ? "AI Offline" : `Match: ${current.match}`}
          </div>
        </div>

        <p className="text-xs text-white/90 leading-relaxed mb-6 bg-white/5 p-3.5 rounded-2xl border border-white/5">
          {current.tagline}
        </p>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3.5 text-xs mb-6">
          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
            <span className="text-[10px] text-[#c5c9b2] uppercase tracking-wider block font-semibold mb-1">Revenue (ARR)</span>
            <span className="font-extrabold text-[#ccf063] text-sm">{current.arr}</span>
          </div>
          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
            <span className="text-[10px] text-[#c5c9b2] uppercase tracking-wider block font-semibold mb-1">Funding Goal</span>
            <span className="font-extrabold text-[#ccf063] text-sm">{current.goal}</span>
          </div>
          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
            <span className="text-[10px] text-[#c5c9b2] uppercase tracking-wider block font-semibold mb-1">Growth (YoY)</span>
            <span className="font-extrabold text-[#ccf063] text-sm">{current.growth}</span>
          </div>
          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
            <span className="text-[10px] text-[#c5c9b2] uppercase tracking-wider block font-semibold mb-1">AI Score</span>
            <span className="font-extrabold text-[#ccf063] text-sm">{current.aiScore}</span>
          </div>
        </div>

        <div className="flex justify-between items-center text-xs text-[#c5c9b2]/60 pt-4 border-t border-white/5">
          <span>Market Size: {current.tam}</span>
          <button onClick={() => { setShowDetailsSheet(false); setShowFullSpecs(true); }} className="text-[#ccf063] font-bold flex items-center gap-1 hover:underline">
            Full Specs <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

    </div>

      {/* Full Specs Slide-In Drawer for Mobile */}
      <div 
        className={`fixed top-[80px] right-0 h-[calc(100vh-80px)] w-full bg-[#1a1a1a] shadow-2xl z-[9999] transform transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col md:hidden ${
          showFullSpecs ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#1a1a1a] shrink-0 z-10 sticky top-0">
          <h2 className="text-lg font-bold text-white font-sans">Venture Profile</h2>
          <button 
            onClick={() => setShowFullSpecs(false)}
            className="w-10 h-10 hover:bg-white/10 text-white rounded-full flex items-center justify-center transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto px-6 py-6 relative bg-[#121212]">
          {loadingProfile ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-white/50 text-xs">
              <div className="w-6 h-6 border-2 border-[#ccf063] border-t-transparent rounded-full animate-spin" />
              Fetching database profile...
            </div>
          ) : (
            profileData && <PitchDetails startup={profileData} />
          )}
        </div>

        {/* Request for Deal Button Footer */}
        {!loadingProfile && profileData && (
          <div className="px-6 py-4 border-t border-white/10 bg-[#1a1a1a] shrink-0 z-10">
            <RequestDealButton startup={profileData} userEmail={userEmail} />
          </div>
        )}
      </div>

      {/* Autonomous AI Recommendation Modal */}
      {autonomousRecommendation && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100000] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-[#1f1f1f] border border-[#ccf063]/30 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-[0_0_50px_rgba(204,240,99,0.15)] relative">
            <button 
              onClick={() => setAutonomousRecommendation(null)}
              className="absolute top-4 right-4 p-2 text-white/50 hover:text-white rounded-full hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-[#ccf063]/10 border border-[#ccf063]/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-[#ccf063]" />
              </div>
              <div>
                <h3 className="text-[#ccf063] font-bold uppercase tracking-widest text-xs mb-1">AI Top Pick</h3>
                <h2 className="text-2xl font-serif font-bold text-white leading-tight">{autonomousRecommendation.name}</h2>
              </div>
            </div>
            <p className="text-sm text-[#c5c9b2] mb-6 leading-relaxed bg-black/30 p-4 rounded-xl border border-white/5">
              "Based on your thesis and recent passes, this startup is highly aligned. {autonomousRecommendation.tagline}"
            </p>
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  try {
                    await fetch("/api/interactions", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ startupId: autonomousRecommendation.id, action: "request_intro", investorEmail: userEmail, isAutonomous: true })
                    });
                    setNotification({ message: "Intro requested!", type: "success" });
                    setAutonomousRecommendation(null);
                  } catch (e) {
                    console.error(e);
                  }
                }}
                className="flex-1 bg-[#ccf063] text-black font-bold py-3 rounded-xl hover:bg-[#bce650] transition-colors"
              >
                Interested (Request Deal)
              </button>
              <button
                onClick={async () => {
                  try {
                    await fetch("/api/interactions", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ startupId: autonomousRecommendation.id, action: "pass", feedback: "Not a match for my current pipeline.", investorEmail: userEmail, isAutonomous: true })
                    });
                    setNotification({ message: "Passed. Thesis updated.", type: "success" });
                    setAutonomousRecommendation(null);
                  } catch (e) {
                    console.error(e);
                  }
                }}
                className="flex-1 bg-white/5 text-white font-bold py-3 rounded-xl border border-white/10 hover:bg-white/10 transition-colors"
              >
                Pass
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Floating Toast Notification Overlay */}
      {notification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 md:top-auto md:bottom-6 md:left-auto md:right-6 md:translate-x-0 z-[100000] animate-in slide-in-from-top md:slide-in-from-bottom duration-300 px-4 w-full max-w-sm">
          <div className={`flex items-center gap-2.5 px-4.5 py-3 rounded-2xl border backdrop-blur-md shadow-lg ${
            notification.type === 'success' 
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' 
              : 'bg-red-500/15 border-red-500/30 text-red-400'
          }`}>
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="text-xs font-semibold">{notification.message}</span>
          </div>
        </div>
      )}
    </>
  );
}
