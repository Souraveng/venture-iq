"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Suspense } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  MapPin,
  Clock,
  ArrowUpRight,
  Edit3,
  Calendar,
  Layers,
  ChevronRight,
  Globe,
  Plus,
  Play,
  Save,
  Trash2,
  Building2,
  Share2,
  MessageSquare,
  Heart,
  X
} from "lucide-react";


export default function FounderProfilePageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh] text-[#c5c9b2]">Loading...</div>}>
      <FounderProfilePage />
    </Suspense>
  );
}

function FounderProfilePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryEmail = searchParams?.get("email");
  const { userEmail, userName, userImage } = useAuth();
  
  const isOwnProfile = !queryEmail || queryEmail === userEmail;
  const targetEmail = queryEmail || userEmail;
  
  // Toggle between viewing and editing
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile data state (Synced with Azure PostgreSQL)
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
          authorEmail: userEmail // used for authorization
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

  const [profile, setProfile] = useState({
    fullName: userName || "",
    roleTitle: "",
    avatarUrl: userImage || "",
    location: "",
    linkedinUrl: "",
    commitment: "",
    equityStake: "",
    startupName: "",
    startupLink: "/founder/fundraising",
    aboutQuote: "",
    aboutText: "",
    domainExpertise: [] as string[],
    keySkills: [] as string[],
    teamSize: "",
    verificationBadge: "Identity Verified (Tier 1)",
    background: [] as { degree: string; org: string }[]
  });

  // Edit fields temp state
  const [editForm, setEditForm] = useState({ ...profile });

  // Fetch Profile from Azure PostgreSQL Database on Load
  useEffect(() => {
    async function fetchProfile() {
      if (!targetEmail) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/founder/profile?email=${encodeURIComponent(targetEmail)}`);
        const result = (await res.json()) as any;

        if (result.success && result.data) {
          const data = result.data;
          const loadedData = {
            fullName: data.fullName || userName || "",
            roleTitle: data.roleTitle || "",
            avatarUrl: data.avatarUrl || userImage || "",
            location: data.location || "",
            linkedinUrl: data.linkedinUrl || "",
            commitment: data.commitment || "",
            equityStake: data.equityStake || "",
            startupName: data.startupName || "",
            startupLink: data.startupLink || "/founder/fundraising",
            aboutQuote: data.aboutQuote || "",
            aboutText: data.aboutText || "",
            domainExpertise: Array.isArray(data.domainExpertise) ? data.domainExpertise : [],
            keySkills: Array.isArray(data.keySkills) ? data.keySkills : [],
            teamSize: data.teamSize || "",
            verificationBadge: data.verificationBadge || "Identity Verified (Tier 1)",
            background: Array.isArray(data.background) ? data.background : []
          };
          setProfile(loadedData);
          setEditForm(loadedData);
        }
      } catch (err) {
        console.error("Failed to load founder profile from DB:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [targetEmail, userName, userImage]);

  // GSAP Animations
  useEffect(() => {
    if (loading) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".animate-item",
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: "power2.out" }
      );
    }, containerRef);
    return () => ctx.revert();
  }, [isEditing, loading]);

  const handleEdit = () => {
    setEditForm({ ...profile });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!userEmail) return;
    setSaving(true);
    try {
      const payload = {
        email: userEmail,
        fullName: editForm.fullName,
        roleTitle: editForm.roleTitle,
        avatarUrl: editForm.avatarUrl,
        location: editForm.location,
        linkedinUrl: editForm.linkedinUrl,
        commitment: editForm.commitment,
        equityStake: editForm.equityStake,
        startupName: editForm.startupName,
        aboutQuote: editForm.aboutQuote,
        aboutText: editForm.aboutText,
        domainExpertise: editForm.domainExpertise,
        keySkills: editForm.keySkills,
        teamSize: editForm.teamSize,
        verificationBadge: editForm.verificationBadge,
        background: editForm.background,
      };

      const res = await fetch("/api/founder/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as any;
      if (res.ok && data.success) {
        setProfile({ ...editForm });
        setIsEditing(false);

      } else {
        alert("Failed to save profile to PostgreSQL database.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddBackground = () => {
    setEditForm(prev => ({
      ...prev,
      background: [...prev.background, { degree: "New Role/Degree", org: "Organization" }]
    }));
  };

  const handleRemoveBackground = (idx: number) => {
    setEditForm(prev => ({
      ...prev,
      background: prev.background.filter((_, i) => i !== idx)
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-[#c5c9b2] text-sm">
        <div className="flex items-center gap-3 bg-[#191919] border border-white/10 px-6 py-4 rounded-2xl">
          <div className="w-5 h-5 border-2 border-[#ccf063] border-t-transparent rounded-full animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-8 max-w-7xl mx-auto font-sans pb-12">
      
      {/* Header section with toggle buttons */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-white/5 pb-6">
        <div className="animate-item">
          <h2 className="text-4xl font-serif text-white italic">Founder Profile</h2>
          {isOwnProfile ? (
            <p className="text-xs text-[#c5c9b2] mt-1">
              Connected Account: <span className="text-white font-semibold">{userEmail || "himanshu25b@gmail.com"}</span> • PostgreSQL DB Synced
            </p>
          ) : (
             <p className="text-xs text-[#c5c9b2] mt-1">
              <span className="text-white font-semibold">{targetEmail}</span>
            </p>
          )}
        </div>
        {isOwnProfile && (
          <div className="animate-item flex gap-3 w-full sm:w-auto">
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="flex items-center gap-1.5 px-6 py-3 rounded-xl border border-white/10 bg-white/5 text-white text-xs font-bold hover:bg-white/10 transition-all hover:scale-102"
              >
                <Edit3 className="w-4 h-4" /> Edit Profile
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-6 py-3 rounded-xl bg-[#ccf063] text-black text-xs font-bold hover:bg-[#c2e45d] disabled:opacity-50 transition-all hover:scale-102 shadow-md shadow-[#ccf063]/10"
              >
                <Save className="w-4 h-4" /> {saving ? "Saving to Azure DB..." : "Save Changes"}
              </button>
            )}
          </div>
        )}
      </header>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-white/10 pb-4">
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
      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Personal info */}
        <div className="animate-item bg-[#1f1f1f] border border-white/10 rounded-2xl p-6 flex flex-col items-center relative overflow-hidden">
          <div className="absolute top-4 left-4">
            <span className="bg-[#ccf063]/10 text-[#ccf063] text-sm px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border border-[#ccf063]/30 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> {profile.verificationBadge}
            </span>
          </div>

          <div className="mt-10 mb-6">
            <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-[#ccf063]/30 ring-8 ring-[#ccf063]/5 bg-slate-800 flex items-center justify-center text-3xl font-extrabold text-[#ccf063]">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                profile.fullName.slice(0, 2).toUpperCase()
              )}
            </div>
          </div>

          {!isEditing ? (
            <div className="text-center space-y-1">
              <h3 className="text-xl font-bold text-white font-serif">{profile.fullName}</h3>
              <p className="text-[#ccf063] text-sm font-bold uppercase tracking-wider">{profile.roleTitle}</p>
              <div className="flex justify-center items-center gap-3 pt-3 text-[#c5c9b2]">
                <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" className="hover:text-white transition-colors flex items-center gap-1 text-xs">
                  <Globe className="w-4 h-4" /> LinkedIn
                </a>
                <span className="text-white/10">|</span>
                <span className="flex items-center gap-1 text-[11px]"><MapPin className="w-3 h-3" /> {profile.location}</span>
              </div>
            </div>
          ) : (
            <div className="w-full space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-sm uppercase font-bold text-[#c5c9b2] tracking-wider">Full Name *</label>
                <input
                  type="text"
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm uppercase font-bold text-[#c5c9b2] tracking-wider">Role / Title *</label>
                <input
                  type="text"
                  value={editForm.roleTitle}
                  onChange={(e) => setEditForm({ ...editForm, roleTitle: e.target.value })}
                  className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm uppercase font-bold text-[#c5c9b2] tracking-wider">LinkedIn URL</label>
                <input
                  type="text"
                  value={editForm.linkedinUrl}
                  onChange={(e) => setEditForm({ ...editForm, linkedinUrl: e.target.value })}
                  className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm uppercase font-bold text-[#c5c9b2] tracking-wider">Location</label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-white focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Commitment & Equity Info (Must-Haves) */}
          <div className="w-full grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-white/5 text-xs">
            <div>
              <p className="text-[#c5c9b2] text-sm uppercase tracking-wider mb-1">Commitment Status *</p>
              {!isEditing ? (
                <p className="text-white font-bold">{profile.commitment}</p>
              ) : (
                <select
                  value={editForm.commitment}
                  onChange={(e) => setEditForm({ ...editForm, commitment: e.target.value })}
                  className="w-full bg-black border border-white/10 rounded-xl p-2 text-white text-xs focus:outline-none"
                >
                  <option>Full-time</option>
                  <option>Part-time</option>
                  <option>Advisory</option>
                </select>
              )}
            </div>
            <div className="text-right">
              <p className="text-[#c5c9b2] text-sm uppercase tracking-wider mb-1">Founder Equity Stake *</p>
              {!isEditing ? (
                <p className="text-white font-bold">{profile.equityStake}%</p>
              ) : (
                <input
                  type="text"
                  value={editForm.equityStake}
                  onChange={(e) => setEditForm({ ...editForm, equityStake: e.target.value })}
                  className="w-20 bg-black border border-white/10 rounded-xl p-2 text-white text-right text-xs focus:outline-none"
                />
              )}
            </div>
          </div>
        </div>

        {/* Right Column: About Founder & Associated Startup Link */}
        <div className="animate-item lg:col-span-2 bg-[#1f1f1f] border border-white/10 rounded-2xl p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <h4 className="text-[#c5c9b2] text-sm uppercase font-bold tracking-wider">About Founder & Venture</h4>
              
              {/* Associated Startup Link (Must-Have) */}
              <div className="bg-[#131313] border border-white/5 rounded-xl p-3 flex flex-col">
                <span className="text-[#ccf063] text-sm uppercase font-bold tracking-widest mb-1 font-mono">Associated Startup *</span>
                {!isEditing ? (
                  <Link href={profile.startupLink || "/founder/fundraising"} className="text-white font-bold text-sm flex items-center gap-1 hover:text-[#ccf063] transition-colors">
                    {profile.startupName} <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <input
                    type="text"
                    value={editForm.startupName}
                    onChange={(e) => setEditForm({ ...editForm, startupName: e.target.value })}
                    className="bg-black border border-white/10 rounded-lg px-2 py-1 text-white text-xs font-bold focus:outline-none"
                  />
                )}
              </div>
            </div>

            {!isEditing ? (
              <div className="space-y-4">
                <h4 className="text-2xl font-serif text-white italic leading-snug">
                  "{profile.aboutQuote}"
                </h4>
                <p className="text-xs text-[#c5c9b2] leading-relaxed">
                  {profile.aboutText}
                </p>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-sm uppercase font-bold text-[#c5c9b2] tracking-wider">Tagline / Mission Quote</label>
                  <input
                    type="text"
                    value={editForm.aboutQuote}
                    onChange={(e) => setEditForm({ ...editForm, aboutQuote: e.target.value })}
                    className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-white focus:outline-none text-sm font-serif italic"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm uppercase font-bold text-[#c5c9b2] tracking-wider">Brief Bio (1-2 sentences) *</label>
                  <textarea
                    value={editForm.aboutText}
                    rows={4}
                    onChange={(e) => setEditForm({ ...editForm, aboutText: e.target.value })}
                    className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-white focus:outline-none leading-relaxed text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-4 border-t border-white/5">
            <div>
              <p className="text-[#c5c9b2] text-sm uppercase font-bold tracking-wider mb-2">Domain Expertise</p>
              {!isEditing ? (
                <div className="flex flex-wrap gap-1.5">
                  {profile.domainExpertise.length === 0 ? (
                    <span className="text-white/40 italic">None added</span>
                  ) : (
                    profile.domainExpertise.map((exp) => (
                      <span key={exp} className="bg-black/35 px-2.5 py-1 rounded-md text-sm text-[#c5c9b2] border border-white/5">
                        {exp}
                      </span>
                    ))
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {editForm.domainExpertise.map((exp, idx) => (
                      <span key={idx} className="bg-[#ccf063]/10 text-[#ccf063] border border-[#ccf063]/20 px-2 py-0.5 rounded-md text-xs flex items-center gap-1 font-semibold">
                        {exp}
                        <button
                          onClick={() => setEditForm({
                            ...editForm,
                            domainExpertise: editForm.domainExpertise.filter((_, i) => i !== idx)
                          })}
                          className="hover:text-red-400"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      placeholder="Add domain..."
                      id="newDomainInput"
                      className="bg-black border border-white/10 rounded-lg px-2 py-1 text-white text-xs flex-1 focus:outline-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.currentTarget.value.trim()) {
                          e.preventDefault();
                          setEditForm({ ...editForm, domainExpertise: [...editForm.domainExpertise, e.currentTarget.value.trim()] });
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
            <div>
              <p className="text-[#c5c9b2] text-sm uppercase font-bold tracking-wider mb-2">Key Skills</p>
              {!isEditing ? (
                <div className="flex flex-wrap gap-1.5">
                  {profile.keySkills.length === 0 ? (
                    <span className="text-white/40 italic">None added</span>
                  ) : (
                    profile.keySkills.map((skill) => (
                      <span key={skill} className="bg-black/35 px-2.5 py-1 rounded-md text-sm text-[#c5c9b2] border border-white/5">
                        {skill}
                      </span>
                    ))
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {editForm.keySkills.map((skill, idx) => (
                      <span key={idx} className="bg-[#ccf063]/10 text-[#ccf063] border border-[#ccf063]/20 px-2 py-0.5 rounded-md text-xs flex items-center gap-1 font-semibold">
                        {skill}
                        <button
                          onClick={() => setEditForm({
                            ...editForm,
                            keySkills: editForm.keySkills.filter((_, i) => i !== idx)
                          })}
                          className="hover:text-red-400"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      placeholder="Add skill..."
                      className="bg-black border border-white/10 rounded-lg px-2 py-1 text-white text-xs flex-1 focus:outline-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.currentTarget.value.trim()) {
                          e.preventDefault();
                          setEditForm({ ...editForm, keySkills: [...editForm.keySkills, e.currentTarget.value.trim()] });
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
            <div>
              <p className="text-[#c5c9b2] text-sm uppercase font-bold tracking-wider mb-2">Team Structure</p>
              {!isEditing ? (
                <div className="p-3 bg-black/40 border border-white/5 rounded-xl flex items-center justify-center font-bold text-[#ccf063] gap-1.5 text-center">
                  <span>{profile.teamSize || "1"} Co-founders</span>
                </div>
              ) : (
                <div className="space-y-1">
                  <input
                    type="text"
                    value={editForm.teamSize}
                    onChange={(e) => setEditForm({ ...editForm, teamSize: e.target.value })}
                    placeholder="e.g. 3"
                    className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-white text-xs font-bold focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Row 2: Background History & Intro Video Presentation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Background & Successes List */}
        <div className="animate-item lg:col-span-3 bg-[#1f1f1f] border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
          <div>
            <h4 className="text-[#c5c9b2] text-sm uppercase font-bold tracking-wider mb-4">Background & Exits / Successes</h4>
            <div className="space-y-4">
              {(!isEditing ? profile.background : editForm.background).map((bg: any, idx: number) => (
                <div key={idx} className="flex items-start gap-3 text-xs justify-between group">
                  <div>
                    <p className="text-white font-bold">{bg.degree}</p>
                    <p className="text-sm text-[#c5c9b2]/60 mt-0.5">{bg.org}</p>
                  </div>
                  {isEditing && (
                    <button
                      onClick={() => handleRemoveBackground(idx)}
                      className="text-red-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {isEditing && (
            <button
              onClick={handleAddBackground}
              className="w-full mt-4 py-2 border border-dashed border-white/20 hover:border-[#ccf063] rounded-xl text-[11px] font-semibold text-white/50 hover:text-[#ccf063] transition-all flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Background / Exit Entry
            </button>
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
