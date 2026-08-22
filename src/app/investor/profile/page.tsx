"use client";

import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Suspense } from "react";
import {
  CheckCircle2,
  MapPin,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  Globe,
  Zap,
  Building2,
  Settings,
  Clock,
  Award,
  Activity,
  ChevronLeft,
  Star,
  ExternalLink,
  Trash2,
  Heart,
  MessageSquare,
  Edit3,
  X
} from "lucide-react";

export default function InvestorPublicProfilePageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh] text-white">Loading...</div>}>
      <InvestorPublicProfilePage />
    </Suspense>
  );
}

function InvestorPublicProfilePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryEmail = searchParams?.get("email");
  const { userEmail, userName, userImage } = useAuth();
  
  const isOwnProfile = !queryEmail || queryEmail === userEmail;
  const targetEmail = queryEmail || userEmail || "himanshu25b@gmail.com";

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      try {
        const res = await fetch(`/api/investors/profile?email=${encodeURIComponent(targetEmail)}`);
        const result = (await res.json()) as any;
        if (result.success && result.data) {
          setData(result.data);
        }
      } catch (err) {
        console.error("Error loading investor profile:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [targetEmail]);

  const [activeTab, setActiveTab] = useState("PROFILE");
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  // Post editing state
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingPostContent, setEditingPostContent] = useState("");

  const fetchUserPosts = async () => {
    setLoadingPosts(true);
    try {
      const res = await fetch("/api/posts");
      const json = (await res.json()) as any;
      if (json.success) {
        setUserPosts(json.posts.filter((p: any) => p.authorEmail === targetEmail));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    if (activeTab === "POSTS") {
      fetchUserPosts();
    }
  }, [activeTab]);

  const handleDeletePost = async (id: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      await fetch(`/api/posts/${id}`, { method: "DELETE" });
      setUserPosts(prev => prev.filter(p => p.id !== id));
    } catch (e) {
      console.error("Failed to delete post:", e);
    }
  };

  const handleUpdatePost = async (id: string) => {
    if (!editingPostContent.trim()) return;
    try {
      const res = await fetch("/api/posts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: id,
          content: editingPostContent,
          authorEmail: userEmail
        })
      });
      const json = (await res.json()) as any;
      if (json.success) {
        setUserPosts(prev => prev.map(p => p.id === id ? { ...p, content: editingPostContent } : p));
        setEditingPostId(null);
      }
    } catch (e) {
      console.error("Failed to update post:", e);
    }
  };


  useEffect(() => {
    if (loading) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".animate-item",
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.55, stagger: 0.08, ease: "power2.out" }
      );
    }, containerRef);
    return () => ctx.revert();
  }, [loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 bg-[#191919] border border-white/10 px-6 py-4 rounded-2xl">
          <div className="w-5 h-5 border-2 border-[#ccf063] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-[#c5c9b2]">Loading profile...</span>
        </div>
      </div>
    );
  }

  // Field defaults
  const name = data?.name || userName || "Investor";
  const firm = data?.firm || "—";
  const role = data?.role || "Angel Investor";
  const avatar = data?.avatarUrl || userImage || null;
  const investorType = data?.investorType || "Individual Angel";
  const location = data?.location || "Global";
  const thesis = data?.thesis || "No thesis added yet.";
  const currentInterests = data?.currentInterestText || null;
  const focusSectors: string[] = data?.focusSectors || [];
  const preferredStages: string[] = data?.preferredStages || [];
  const preferredInstruments: string[] = data?.preferredInstruments || [];
  const minCheck = data?.minCheckSize || "—";
  const maxCheck = data?.maxCheckSize || "—";
  const accreditation = data?.accreditationStatus || "Unverified";
  const activityStatus = data?.activityStatus || "Status unknown";
  const isLead = !!data?.isLeadInvestor;
  const followsOn = !!data?.followsOn;
  const portfolioCompanies: string[] = data?.portfolioCompanies || [];
  const valueAdd: string[] = data?.valueAdd || [];
  const geoPreferences = data?.geoPreferences || "—";
  const investmentStyle = data?.investmentStyle || "—";
  const decisionSpeed = data?.decisionSpeed || "—";
  const followOnCapacity = data?.followOnCapacity || "—";
  const responseRate = data?.responseRate || "—";
  const trustScore = data?.trustScore || "—";
  const linkedIn = data?.linkedIn || null;
  const twitter = data?.twitter || null;
  const previousExits = data?.previousExits ?? 0;
  const riskAppetite = data?.riskAppetite || "—";

  const initials = name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  const isActivelyDeploying = activityStatus.toLowerCase().includes("actively");
  const isAccredited = accreditation.toLowerCase().includes("accredited") || accreditation.toLowerCase().includes("verified");

  const deploymentRows = [
    { label: "Check Size Range", value: `${minCheck} – ${maxCheck}`, accent: true },
    { label: "Investor Type", value: investorType },
    { label: "Lead Investor", value: isLead ? "Yes — leads rounds" : "No" },
    { label: "Follow-on Capital", value: followsOn ? "Yes" : "No" },
    { label: "Follow-on Capacity", value: followOnCapacity },
    { label: "Accreditation", value: accreditation },
  ];

  const dealRows = [
    { label: "Investment Style", value: investmentStyle },
    { label: "Decision Speed", value: decisionSpeed },
    { label: "Risk Appetite", value: riskAppetite },
  ];

  return (
    <div ref={containerRef} className="space-y-6 max-w-7xl mx-auto font-sans pt-8 pb-16 px-1">

      {/* Top Bar */}
      <div className="animate-item flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-xs text-white/50 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        {isOwnProfile && (
          <button
            onClick={() => router.push("/investor/edit-profile")}
            className="flex items-center gap-1.5 text-xs text-[#ccf063] hover:underline font-semibold"
          >
            <Settings className="w-3.5 h-3.5" /> Edit Profile
          </button>
        )}
      </div>

      {/* ── Hero Card ── */}
      <div className="animate-item relative bg-[#1f1f1f] border border-white/10 rounded-2xl p-6 md:p-8 overflow-hidden shadow-2xl">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-[#ccf063]/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          {/* Identity */}
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-[#ccf063]/40 bg-slate-800 flex items-center justify-center text-2xl font-extrabold text-[#ccf063] shadow-lg shrink-0">
              {avatar
                ? <img src={avatar} alt={name} className="w-full h-full object-cover" />
                : initials}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold text-white font-serif">{name}</h1>
                {isAccredited && (
                  <span className="flex items-center gap-1 bg-[#ccf063]/10 border border-[#ccf063]/30 px-2.5 py-1 rounded-full text-[9px] font-bold text-[#ccf063] uppercase tracking-wider shrink-0">
                    <ShieldCheck className="w-3 h-3" /> Accredited
                  </span>
                )}
                {isActivelyDeploying && (
                  <span className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full text-[9px] font-bold text-emerald-400 uppercase tracking-wider shrink-0">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> Active
                  </span>
                )}
              </div>
              <p className="text-sm text-[#ccf063] font-semibold">{role} · {firm}</p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-[#c5c9b2]">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{location}</span>
                <span className="bg-black/40 border border-white/5 px-2.5 py-0.5 rounded-md text-[10px] font-bold">{investorType}</span>
                {riskAppetite !== "—" && (
                  <span className="text-[10px] bg-violet-500/10 border border-violet-500/20 text-violet-300 px-2.5 py-0.5 rounded-md font-semibold">{riskAppetite} Risk</span>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-3 shrink-0">
            {[
              { label: "Trust Score", value: trustScore, accent: true },
              { label: "Response", value: responseRate },
              { label: "Exits", value: String(previousExits) },
            ].map(({ label, value, accent }) => (
              <div key={label} className="bg-black/40 border border-white/5 p-4 rounded-xl text-center min-w-[80px]">
                <p className="text-[9px] uppercase tracking-wider text-[#c5c9b2] mb-1">{label}</p>
                <p className={`text-xl font-extrabold ${accent ? "text-[#ccf063]" : "text-white"}`}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Banner */}
        <div className="mt-5 relative z-10">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border ${
            isActivelyDeploying
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-white/5 border-white/10 text-white/50"
          }`}>
            <Activity className="w-3.5 h-3.5" />
            {activityStatus}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-white/10 pb-4 mt-6">
        <button
          onClick={() => setActiveTab("PROFILE")}
          className={`text-sm font-bold pb-2 transition-colors ${activeTab === "PROFILE" ? "text-[#ccf063] border-b-2 border-[#ccf063]" : "text-white/50 hover:text-white"}`}
        >
          Profile Info
        </button>
        <button
          onClick={() => setActiveTab("POSTS")}
          className={`text-sm font-bold pb-2 transition-colors ${activeTab === "POSTS" ? "text-[#ccf063] border-b-2 border-[#ccf063]" : "text-white/50 hover:text-white"}`}
        >
          {isOwnProfile ? "Manage Posts" : "Posts"}
        </button>
      </div>

      {activeTab === "PROFILE" ? (
      <>
      {/* ── Main 2-col Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">

          {/* Thesis */}
          <div className="animate-item bg-[#1f1f1f] border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-white/5">
              <Star className="w-4 h-4 text-[#ccf063]" />
              <h2 className="text-base font-bold text-white font-serif">Investment Thesis</h2>
            </div>
            <p className="text-sm text-[#c5c9b2] leading-relaxed">{thesis}</p>
            {currentInterests && (
              <div className="bg-[#ccf063]/5 border border-[#ccf063]/20 rounded-xl p-4">
                <p className="text-[10px] uppercase font-bold text-[#ccf063] tracking-wider mb-1.5">Currently Looking For</p>
                <p className="text-xs text-[#c5c9b2] leading-relaxed">{currentInterests}</p>
              </div>
            )}
          </div>

          {/* Focus */}
          <div className="animate-item bg-[#1f1f1f] border border-white/10 rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-white/5">
              <TrendingUp className="w-4 h-4 text-[#ccf063]" />
              <h2 className="text-base font-bold text-white font-serif">Investment Focus</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                {
                  label: "Focus Sectors",
                  items: focusSectors,
                  cls: "bg-[#ccf063]/10 border-[#ccf063]/25 text-[#ccf063]",
                },
                {
                  label: "Preferred Stage",
                  items: preferredStages,
                  cls: "bg-white/5 border-white/10 text-white",
                },
                {
                  label: "Preferred Instrument",
                  items: preferredInstruments,
                  cls: "bg-violet-500/10 border-violet-500/25 text-violet-300",
                },
              ].map(({ label, items, cls }) => (
                <div key={label} className="space-y-2">
                  <p className="text-[10px] uppercase font-bold text-[#c5c9b2] tracking-wider">{label}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {items.length > 0
                      ? items.map((s) => (
                          <span key={s} className={`border px-2.5 py-1 rounded-full text-[10px] font-semibold ${cls}`}>{s}</span>
                        ))
                      : <span className="text-xs text-white/30">Not specified</span>
                    }
                  </div>
                </div>
              ))}
              <div className="space-y-2">
                <p className="text-[10px] uppercase font-bold text-[#c5c9b2] tracking-wider">Geography</p>
                <p className="text-xs text-white font-semibold flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#c5c9b2]" /> {geoPreferences}
                </p>
              </div>
            </div>
          </div>

          {/* Portfolio */}
          {portfolioCompanies.length > 0 && (
            <div className="animate-item bg-[#1f1f1f] border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-white/5">
                <Building2 className="w-4 h-4 text-[#ccf063]" />
                <h2 className="text-base font-bold text-white font-serif">Portfolio Companies</h2>
                <span className="ml-auto text-[10px] text-[#c5c9b2] bg-white/5 px-2 py-0.5 rounded-full font-bold">{portfolioCompanies.length} investments</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {portfolioCompanies.map((company) => (
                  <span key={company} className="flex items-center gap-1.5 bg-black/50 border border-white/10 text-white px-3 py-1.5 rounded-xl text-xs font-semibold hover:border-[#ccf063]/40 transition-colors">
                    <Building2 className="w-3.5 h-3.5 text-[#ccf063]" /> {company}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Value Add */}
          {valueAdd.length > 0 && (
            <div className="animate-item bg-[#1f1f1f] border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-white/5">
                <Award className="w-4 h-4 text-[#ccf063]" />
                <h2 className="text-base font-bold text-white font-serif">Value Add</h2>
              </div>
              <div className="space-y-2">
                {valueAdd.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-black/30 border border-white/5 rounded-xl">
                    <div className="w-5 h-5 rounded-full bg-[#ccf063]/10 border border-[#ccf063]/25 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3 h-3 text-[#ccf063]" />
                    </div>
                    <p className="text-xs text-[#c5c9b2]">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div className="space-y-6">

          {/* Deployment Parameters */}
          <div className="animate-item bg-[#1f1f1f] border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-white/5">
              <DollarSign className="w-4 h-4 text-[#ccf063]" />
              <h2 className="text-sm font-bold text-white font-serif">Deployment</h2>
            </div>
            <div className="space-y-0 text-xs">
              {deploymentRows.map(({ label, value, accent }) => (
                <div key={label} className="flex justify-between items-center py-2.5 border-b border-white/5 last:border-none">
                  <span className="text-[#c5c9b2]">{label}</span>
                  <span className={`font-bold text-[10px] text-right max-w-[130px] ${accent ? "text-[#ccf063]" : "text-white"}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Deal Style */}
          <div className="animate-item bg-[#1f1f1f] border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-white/5">
              <Zap className="w-4 h-4 text-[#ccf063]" />
              <h2 className="text-sm font-bold text-white font-serif">Deal Style</h2>
            </div>
            <div className="space-y-0 text-xs">
              {dealRows.map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-2.5 border-b border-white/5 last:border-none">
                  <span className="text-[#c5c9b2]">{label}</span>
                  <span className="font-bold text-[10px] text-right max-w-[130px] text-white">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Platform Metrics */}
          <div className="animate-item bg-[#1f1f1f] border border-white/10 rounded-2xl p-6 space-y-3">
            <h2 className="text-sm font-bold text-white font-serif pb-3 border-b border-white/5">Platform Metrics</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-black/40 p-3 rounded-xl text-center border border-white/5">
                <p className="text-[9px] uppercase tracking-wider text-[#c5c9b2]">Response Rate</p>
                <p className="text-lg font-bold text-white mt-1">{responseRate}</p>
                <p className="text-[9px] text-emerald-400 font-semibold mt-0.5">Computed</p>
              </div>
              <div className="bg-black/40 p-3 rounded-xl text-center border border-white/5">
                <p className="text-[9px] uppercase tracking-wider text-[#c5c9b2]">Trust Score</p>
                <p className="text-lg font-bold text-[#ccf063] mt-1">{trustScore}</p>
                <p className="text-[9px] text-neutral-400 font-semibold mt-0.5">Verified</p>
              </div>
            </div>
          </div>

          {/* Social Links */}
          {(linkedIn || twitter) && (
            <div className="animate-item bg-[#1f1f1f] border border-white/10 rounded-2xl p-6 space-y-3">
              <h2 className="text-sm font-bold text-white font-serif pb-3 border-b border-white/5">Links</h2>
              {linkedIn && (
                <a href={linkedIn} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2.5 px-3 py-2.5 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 rounded-xl text-xs text-blue-400 font-semibold transition-all">
                  <Globe className="w-4 h-4" /> LinkedIn
                  <ExternalLink className="w-3 h-3 ml-auto" />
                </a>
              )}
              {twitter && (
                <a href={twitter} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2.5 px-3 py-2.5 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 rounded-xl text-xs text-sky-400 font-semibold transition-all">
                  <Globe className="w-4 h-4" /> Twitter / X
                  <ExternalLink className="w-3 h-3 ml-auto" />
                </a>
              )}
            </div>
          )}

        </div>
      </div>
      </>
      ) : (
        <div className="space-y-6">
          <h3 className="text-xl font-serif text-white mb-4">{isOwnProfile ? "Your Posts" : "Posts"}</h3>
          {loadingPosts ? (
            <p className="text-white/50 text-sm">Loading posts...</p>
          ) : userPosts.length === 0 ? (
            <p className="text-white/50 text-sm">{isOwnProfile ? "You haven't made any posts yet." : "No posts found."}</p>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {userPosts.map(post => (
                <div key={post.id} className="bg-[#1f1f1f] border border-white/10 rounded-2xl p-5 shadow-xl">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-xs text-white/50">{new Date(post.createdAt).toLocaleDateString()}</p>
                    </div>
                    {isOwnProfile && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            if (editingPostId === post.id) {
                              setEditingPostId(null);
                            } else {
                              setEditingPostId(post.id);
                              setEditingPostContent(post.content);
                            }
                          }}
                          className="p-1.5 bg-[#ccf063]/10 hover:bg-[#ccf063]/20 text-[#ccf063] rounded-lg transition-colors"
                        >
                          {editingPostId === post.id ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                        </button>
                        <button 
                          onClick={() => handleDeletePost(post.id)}
                          className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {editingPostId === post.id ? (
                    <div className="space-y-3">
                      <textarea 
                        value={editingPostContent}
                        onChange={(e) => setEditingPostContent(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#ccf063] min-h-[100px]"
                      />
                      <div className="flex justify-end">
                        <button 
                          onClick={() => handleUpdatePost(post.id)}
                          className="px-4 py-2 bg-[#ccf063] hover:bg-[#c2e45d] text-black font-bold text-xs rounded-lg transition-colors"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-white/90 whitespace-pre-wrap">{post.content}</p>
                  )}
                  
                  {post.mediaUrl && (
                    <img src={post.mediaUrl} alt="Post media" className="w-full max-h-64 object-cover rounded-xl mt-4 border border-white/5" />
                  )}
                  <div className="flex gap-4 mt-4 pt-4 border-t border-white/10 text-xs text-white/50 font-bold">
                    <span className="flex items-center gap-1.5"><Heart className="w-4 h-4" /> {post.likes || 0} Likes</span>
                    <span className="flex items-center gap-1.5"><MessageSquare className="w-4 h-4" /> {post.comments?.length || 0} Comments</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

