"use client";

import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import {
  ShieldCheck,
  ShieldAlert,
  Video,
  Database,
  Calendar,
  Sparkles,
  TrendingUp,
  ChevronRight,
  ArrowUpRight,
  Edit2,
  Plus,
  Loader2,
  Building,
  DollarSign,
  MapPin,
  ListRestart
} from "lucide-react";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useVenturePermission } from "@/hooks/useVenturePermission";

export default function FounderFundraisingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { userName, activeStartup } = useAuth();

  const [startup, setStartup] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showUnverifiedBanner, setShowUnverifiedBanner] = useState(true);

  // RBAC checks
  const { can, role, loading: permsLoading } = useVenturePermission(activeStartup?.id || null);
  const canEdit = can("fundraising", "edit");

  const [formData, setFormData] = useState({
    name: "",
    tagline: "",
    category: "",
    stage: "Seed",
    valuation: "",
    targetAmount: "",
    raisedAmount: "",
    location: "",
    traction: "",
    pitchDeckUrl: "#",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load startup data from database
  useEffect(() => {
    async function loadStartup() {
      try {
        const res = await fetch("/api/startups");
        const json = (await res.json()) as any;
        if (json.success && json.data) {
          // Find startup by activeStartup name, fallback to founder name
          const found = json.data.find(
            (s: any) => 
              (activeStartup?.name && s.name === activeStartup.name) ||
              (userName && s.founder.toLowerCase() === userName.toLowerCase())
          );
          if (found) {
            setStartup(found);
            setFormData({
              name: found.name,
              tagline: found.tagline,
              category: found.category,
              stage: found.stage,
              valuation: found.valuation,
              targetAmount: found.targetAmount,
              raisedAmount: found.raisedAmount,
              location: found.location,
              traction: found.traction,
              pitchDeckUrl: found.pitchDeckUrl,
            });
            
            // Fetch dynamic metrics
            const metricsRes = await fetch(`/api/interactions?startupId=${found.id}`);
            const metricsJson = (await metricsRes.json()) as any;
            if (metricsJson.success) {
              setMetrics(metricsJson.data.metrics);
              setActivity(metricsJson.data.activity);
            }
          }
        }
      } catch (err) {
        console.error("Error loading startup:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStartup();
  }, [userName, activeStartup]);

  if (!activeStartup || !activeStartup.name) {
    return (
      <div className="min-h-screen bg-transparent text-zinc-900 dark:text-[#e2e2e2] flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-white dark:bg-[#121212]/95 border border-zinc-200 dark:border-white/10 rounded-3xl p-8 text-center shadow-xl dark:shadow-2xl relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-24 h-24 bg-[#ccf063]/10 rounded-full blur-[40px]" />
          <div className="w-14 h-14 bg-zinc-100 dark:bg-black/40 border border-zinc-200 dark:border-white/5 rounded-2xl flex items-center justify-center text-[#86be14] dark:text-[#ccf063] mx-auto mb-6">
            <TrendingUp className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold font-serif mb-3 text-zinc-900 dark:text-white">Select a Project to Move On</h3>
          <p className="text-xs text-zinc-600 dark:text-[#c5c9b2] leading-relaxed">
            Please select an active startup project from the console header dropdown menu at the top of the page to access your fundraising analytics, deal room, and target metrics.
          </p>
        </div>
      </div>
    );
  }



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/startups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: startup?.id,
          ...formData,
          founder: userName,
          verified: true,
        }),
      });
      const json = (await res.json()) as any;
      if (json.success) {
        setStartup(json.data);
        setIsEditing(false);
      } else {
        alert(json.error || "Failed to save campaign settings.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving campaign settings.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-160px)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#ccf063] animate-spin" />
      </div>
    );
  }

  // Remove the inline form. We will show the dashboard directly.
  const displayStartup = startup || {
    name: activeStartup?.name || "New Project",
    tagline: "-",
    category: "-",
    stage: "-",
    valuation: "0",
    targetAmount: "0",
    raisedAmount: "0",
    location: "-",
    traction: "-",
    pitchDeckUrl: "#",
  };

  // Calculate Progress percentage
  const cleanNumber = (val: string | undefined | null) => {
    if (!val) return 0;
    return parseFloat(val.replace(/[^0-9.]/g, "")) || 0;
  };
  const target = cleanNumber(displayStartup.targetAmount);
  const raised = cleanNumber(displayStartup.raisedAmount);
  const progressPercent = target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : 0;

  // Formatting for relative times
  const timeAgo = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    return `${Math.floor(diff / 86400000)} days ago`;
  };

  return (
    <div ref={containerRef} className="space-y-6 max-w-7xl mx-auto font-sans pb-12 relative min-h-[600px]">

      {/* Unverified Warning Banner */}
      {!activeStartup.verified && showUnverifiedBanner && (
        <div className="animate-item flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-amber-50 border border-amber-400 rounded-xl px-4 py-3 text-xs shadow-sm">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span className="text-amber-800 font-semibold leading-normal">
              Your project is <span className="text-amber-900 font-bold">unverified</span>. Your startup and pitch video are visible to investors but marked as unverified.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end pt-1 sm:pt-0">
            <button
              onClick={() => setShowUnverifiedBanner(false)}
              className="px-3 py-1.5 bg-transparent hover:bg-amber-100 text-amber-700 font-semibold border border-amber-400 rounded-lg transition-all text-xs whitespace-nowrap"
            >
              Do it later
            </button>
            <button
              onClick={() => router.push("/founder/verification")}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-lg transition-all text-xs whitespace-nowrap"
            >
              Verify Now
            </button>
          </div>
        </div>
      )}

      {/* Missing Data Banner */}
      {!startup && (
        <div className="animate-item flex items-center gap-3 bg-blue-50/10 border border-blue-500/30 rounded-xl px-4 py-3 text-xs shadow-sm">
          <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
          <span className="text-blue-300 font-semibold">
            Values will be inserted only after first round upload on matchmaking.
          </span>
        </div>
      )}

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Current Round Card */}
        <div className="animate-item bg-[#1f1f1f] border border-white/10 rounded-2xl p-6 flex flex-col justify-between shadow-xl relative overflow-hidden min-h-[220px]">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm uppercase font-bold text-[#c5c9b2] tracking-wider">Current Round</span>
              {canEdit && (
                <button
                  onClick={() => alert("Edit Round functionality can be added here or in a separate modal.")}
                  className="p-1.5 hover:bg-white/5 rounded-lg border border-white/10 text-white/60 hover:text-white transition-all flex items-center gap-1 text-sm font-bold uppercase tracking-wider cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" /> Edit Round
                </button>
              )}
            </div>
            <h3 className="text-3xl font-bold text-white font-serif tracking-tight">
              {displayStartup.stage} Funding
            </h3>
            <p className="text-xs text-[#ccf063] mt-1 font-semibold">{displayStartup.name}</p>
          </div>

          <div className="space-y-2 mt-4">
            <div className="flex justify-between text-xs text-[#c5c9b2]">
              <span>Amount Raised</span>
              <span className="text-white font-bold">
                {displayStartup.raisedAmount} / {displayStartup.targetAmount}
              </span>
            </div>
            <div className="w-full h-3 bg-black rounded-full overflow-hidden">
              <div
                className="h-full bg-[#ccf063] shadow-[0_0_10px_rgba(204,240,99,0.5)] transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5 mt-4">
            <div>
              <p className="text-sm uppercase font-bold text-[#c5c9b2] tracking-wider">Committed</p>
              <p className="text-xl font-extrabold text-white">{progressPercent}%</p>
            </div>
            <div>
              <p className="text-sm uppercase font-bold text-[#c5c9b2] tracking-wider">Valuation</p>
              <p className="text-xl font-extrabold text-white">{displayStartup.valuation}</p>
            </div>
          </div>
        </div>

        {/* AI Readiness Score */}
        <div className="animate-item bg-[#1f1f1f] border border-white/10 rounded-2xl p-6 flex flex-col justify-between items-center text-center shadow-xl">
          <div className="flex justify-between w-full text-sm font-bold text-white/90">
            <span>AI Readiness Score</span>
            <Sparkles className="w-4 h-4 text-[#ccf063]" />
          </div>

          <div className="w-24 h-24 rounded-full border-4 border-[#ccf063]/25 flex items-center justify-center relative my-4 shadow-lg shadow-[#ccf063]/5">
            <span className="text-3xl font-extrabold text-white font-serif">{startup ? "85" : "0"}</span>
          </div>

          <p className="text-sm text-white/70 leading-relaxed mt-2">
            Your data room is optimized for institutional due diligence checks.
          </p>
        </div>

        {/* Campaign Metrics & Info */}
        <div className="animate-item bg-[#1f1f1f] border border-white/10 rounded-2xl p-6 flex flex-col justify-between shadow-xl">
          <div className="flex justify-between w-full text-sm font-bold text-white/90 mb-3">
            <span>Campaign Profile</span>
            <Building className="w-4 h-4 text-[#ccf063]" />
          </div>

          <div className="space-y-4 text-sm text-white/80">
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ccf063] block" />
              <span className="text-white font-semibold">Sector: {displayStartup.category}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ccf063] block" />
              <span className="text-white font-semibold">Location: {displayStartup.location}</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ccf063] block mt-1.5" />
              <span className="text-white font-semibold line-clamp-2">Traction: {displayStartup.traction}</span>
            </div>
          </div>

          <button
            onClick={() => {
              if (displayStartup.pitchDeckUrl && displayStartup.pitchDeckUrl !== "#") {
                window.open(displayStartup.pitchDeckUrl, "_blank");
              } else {
                alert("No pitch deck link configured yet. Click 'Edit Round' to add one!");
              }
            }}
            className="w-full mt-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white transition-all cursor-pointer"
          >
            Open Pitch Deck
          </button>
        </div>

      </div>

      {/* Middle Row: Pitch Engagement & Live Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Pitch Engagement */}
        <div className="animate-item lg:col-span-2 bg-[#1f1f1f] border border-white/10 rounded-2xl p-6 space-y-6 shadow-xl">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-bold text-white font-serif">Pitch Engagement</h3>
              <p className="text-sm text-white/70 mt-1">Real-time performance of your fundraising assets</p>
            </div>
            <div className="flex gap-1.5 text-sm font-bold">
              <span className="px-2 py-1 rounded bg-[#131313] text-white/50 cursor-pointer">7D</span>
              <span className="px-2 py-1 rounded bg-[#ccf063] text-black cursor-pointer">30D</span>
            </div>
          </div>

          {/* Metric cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div className="p-4 bg-[#131313]/60 border border-white/5 rounded-xl">
              <p className="text-sm font-medium text-white/80">Profile Views</p>
              <p className="text-2xl font-bold text-white mt-1.5">{metrics?.profileViews || 0}</p>
              <p className="text-xs text-[#ccf063] mt-1.5">{startup ? "+12% vs last mo." : "-"}</p>
            </div>
            <div className="p-4 bg-[#131313]/60 border border-white/5 rounded-xl">
              <p className="text-sm font-medium text-white/80">Pitch Video Views</p>
              <p className="text-2xl font-bold text-white mt-1.5">{metrics?.pitchVideoViews || 0}</p>
              <p className="text-xs text-[#ccf063] mt-1.5">{startup ? "+8% vs last mo." : "-"}</p>
            </div>
            <div className="p-4 bg-[#131313]/60 border border-white/5 rounded-xl">
              <p className="text-sm font-medium text-white/80">Unique Investors</p>
              <p className="text-2xl font-bold text-white mt-1.5">{metrics?.uniqueInvestors || 0} VCs</p>
              <p className="text-xs text-[#ccf063] mt-1.5">{startup ? "+28% vs last mo." : "-"}</p>
            </div>
            <div className="p-4 bg-[#131313]/60 border border-white/5 rounded-xl">
              <p className="text-sm font-medium text-white/80">Offer Conversion</p>
              <p className="text-2xl font-bold text-white mt-1.5">{metrics?.offerConversion || 0}%</p>
              <p className="text-xs text-[#ccf063] mt-1.5">Target: 10%</p>
            </div>
            <div className="p-4 bg-[#131313]/60 border border-white/5 rounded-xl">
              <p className="text-sm font-medium text-white/80">Avg Response</p>
              <p className="text-2xl font-bold text-white mt-1.5">{metrics?.avgResponse || 0}h</p>
              <p className="text-xs text-[#ccf063] mt-1.5">Below limit (8h)</p>
            </div>
            <div className="p-4 bg-[#131313]/60 border border-white/5 rounded-xl">
              <p className="text-sm font-medium text-white/80">Campaign Reach</p>
              <p className="text-2xl font-bold text-white mt-1.5">{metrics?.campaignReach || 0}</p>
              <p className="text-xs text-[#ccf063] mt-1.5">{startup ? "+14% vs last mo." : "-"}</p>
            </div>
          </div>

          {/* Dummy Bar Chart */}
          <div className="h-28 flex items-end gap-2.5 pt-4">
            <div className="bg-white/5 w-full rounded-t-md h-[40%]" />
            <div className="bg-white/5 w-full rounded-t-md h-[55%]" />
            <div className="bg-white/5 w-full rounded-t-md h-[50%]" />
            <div className="bg-white/5 w-full rounded-t-md h-[70%]" />
            <div className="bg-[#ccf063]/30 w-full rounded-t-md h-[80%]" />
            <div className="bg-[#ccf063]/60 w-full rounded-t-md h-[90%]" />
            <div className="bg-[#ccf063] w-full rounded-t-md h-full shadow-[0_0_10px_rgba(204,240,99,0.3)]" />
          </div>
        </div>

        {/* Notifications Preview */}
        <div className="animate-item bg-[#1f1f1f] border border-white/10 rounded-2xl p-6 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Notifications</h3>
              <span className="flex items-center gap-1 text-sm font-bold text-[#ccf063] uppercase">
                Incoming
              </span>
            </div>

            <div className="space-y-4 text-xs">
              {activity.length > 0 ? (
                activity.slice(0, 4).map((act, idx) => (
                  <div key={idx} className="flex gap-3 pb-3 border-b border-white/5 last:border-none">
                    <div className="w-7 h-7 rounded-full bg-[#131313] border border-white/10 flex items-center justify-center text-sm font-bold text-[#ccf063] uppercase">
                      {act.actor.slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-white font-bold">
                        {act.actor} <span className="text-white/50 font-normal">{act.desc}</span>
                      </p>
                      <p className="text-sm text-[#c5c9b2]/60 mt-0.5">{timeAgo(act.time)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-white/70 text-sm font-medium text-center pt-8">No requests yet.</div>
              )}
            </div>
          </div>

          <button 
            onClick={() => router.push("/founder/notifications")}
            className="w-full mt-4 text-center text-xs text-[#ccf063] font-bold hover:underline cursor-pointer"
          >
            Manage Deal Room
          </button>
        </div>

      </div>

      {/* Bottom Footer Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-item pt-2">
        {[
          { title: "Update Pitch Video", desc: "Current: 2m 30s · HD", icon: Video },
          { title: "Manage Data Room", desc: "12 files · 3 requests", icon: Database },
          { title: "Upcoming Meetings", desc: "4 this week · 2 pending", icon: Calendar },
          { title: "Investor Outreach", desc: "AI-matching active", icon: Sparkles },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="bg-[#1f1f1f] border border-white/10 p-5 rounded-2xl flex flex-col justify-between hover:border-[#ccf063] cursor-pointer transition-all min-h-[120px] shadow-md"
            >
              <div className="w-9 h-9 bg-black/40 rounded-xl flex items-center justify-center text-[#ccf063]">
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-xs mt-3">
                <p className="font-bold text-white">{item.title}</p>
                <p className="text-sm text-[#c5c9b2]/70 mt-0.5">{item.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
