"use client";

import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  CheckCircle2,
  ShieldCheck,
  Save,
  X,
  Plus,
  Zap,
  Globe,
  Briefcase,
  Share2,
  Building2,
  ChevronLeft,
  User,
  Sliders,
  Camera,
  Loader2
} from "lucide-react";
import { useSessionStorage } from "@/hooks/useSessionStorage";

export default function InvestorEditProfilePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { userEmail, userName, userImage, updateUserImage } = useAuth();
  
  // Tab states
  const [activeTab, setActiveTab] = useState<"profile" | "matching" | "deal" | "social">("profile");

  // Loading & Database Sync States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Profile Identity & Credentials (TAB 1)
  const [username, setUsername] = useSessionStorage('inv-username', "");
  const [name, setName] = useSessionStorage('inv-name', "");
  const [firm, setFirm] = useSessionStorage('inv-firm', "");
  const [role, setRole] = useSessionStorage('inv-role', "");
  const [avatarUrl, setAvatarUrl] = useSessionStorage('inv-avatarUrl', "");
  const [investorType, setInvestorType] = useSessionStorage('inv-investorType', "Individual Angel");
  const [activityStatus, setActivityStatus] = useSessionStorage('inv-activityStatus', "Actively deploying this quarter");
  const [location, setLocation] = useSessionStorage('inv-location', "");
  const [thesis, setThesis] = useSessionStorage('inv-thesis', "");
  const [currentInterestText, setCurrentInterestText] = useSessionStorage('inv-currentInterestText', "");

  // Matching Parameters (TAB 2)
  const [focusSectors, setFocusSectors] = useSessionStorage('inv-focusSectors', ([] as string[]));
  const [preferredStages, setPreferredStages] = useSessionStorage('inv-preferredStages', ([] as string[]));
  const [businessPreferences, setBusinessPreferences] = useSessionStorage('inv-businessPreferences', ([] as string[]));
  const [preferredInstruments, setPreferredInstruments] = useSessionStorage('inv-preferredInstruments', ([] as string[]));
  const [minCheckSize, setMinCheckSize] = useSessionStorage('inv-minCheckSize', "");
  const [maxCheckSize, setMaxCheckSize] = useSessionStorage('inv-maxCheckSize', "");
  const [geoPreferences, setGeoPreferences] = useSessionStorage('inv-geoPreferences', "");

  // Deal Style & Value Add (TAB 3)
  const [portfolioCompanies, setPortfolioCompanies] = useSessionStorage('inv-portfolioCompanies', ([] as string[]));
  const [valueAdd, setValueAdd] = useSessionStorage('inv-valueAdd', ([] as string[]));
  const [investmentStyle, setInvestmentStyle] = useSessionStorage('inv-investmentStyle', "");
  const [decisionSpeed, setDecisionSpeed] = useSessionStorage('inv-decisionSpeed', "");
  const [followOnCapacity, setFollowOnCapacity] = useSessionStorage('inv-followOnCapacity', "");
  const [riskAppetite, setRiskAppetite] = useSessionStorage('inv-riskAppetite', "Moderate");
  const [previousExits, setPreviousExits] = useSessionStorage('inv-previousExits', "0");
  const [isLeadInvestor, setIsLeadInvestor] = useSessionStorage('inv-isLeadInvestor', false);
  const [followsOn, setFollowsOn] = useSessionStorage('inv-followsOn', false);

  // Social Links (TAB 4)
  const [linkedIn, setLinkedIn] = useSessionStorage('inv-linkedIn', "");
  const [twitter, setTwitter] = useSessionStorage('inv-twitter', "");

  // Input helper states
  const [newSector, setNewSector] = useState("");
  const [showSectorInput, setShowSectorInput] = useState(false);
  const [newPortfolio, setNewPortfolio] = useState("");
  const [showPortfolioInput, setShowPortfolioInput] = useState(false);
  const [newValueAdd, setNewValueAdd] = useState("");
  const [showValueAddInput, setShowValueAddInput] = useState(false);

  const handlePhotoUpload = async (file: File) => {
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("photo", file);
      const response = await fetch("/api/profile/photo", { method: "POST", body: formData });
      const data = await response.json() as { success?: boolean; photoUrl?: string; error?: string };
      if (!response.ok || !data.success || !data.photoUrl) throw new Error(data.error || "Upload failed");
      setAvatarUrl(data.photoUrl);
      updateUserImage(data.photoUrl);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Unable to upload profile photo.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Fetch Profile from DB on Load
  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      try {
        if (!userEmail) return;
        const activeEmail = userEmail;
        const res = await fetch(`/api/investors/profile?email=${encodeURIComponent(activeEmail)}`);
        const result = (await res.json()) as any;

        if (result.success && result.data) {
          const data = result.data;
          setUsername(data.username || "");
          setName(data.name || userName || "");
          setFirm(data.firm || "");
          setRole(data.role || "");
          setAvatarUrl(data.avatarUrl || userImage || "");
          setInvestorType(data.investorType || "Individual Angel");
          setThesis(data.thesis || "");
          setFocusSectors(data.focusSectors || []);
          setPreferredStages(data.preferredStages || []);
          setPreferredInstruments(data.preferredInstruments || []);
          setMinCheckSize(data.minCheckSize || "");
          setMaxCheckSize(data.maxCheckSize || "");
          setActivityStatus(data.activityStatus || "Actively deploying this quarter");
          setIsLeadInvestor(!!data.isLeadInvestor);
          setFollowsOn(!!data.followsOn);
          setBusinessPreferences(data.businessPreferences || []);
          setRiskAppetite(data.riskAppetite || "Moderate");
          setPreviousExits(data.previousExits !== undefined ? data.previousExits.toString() : "0");
          setCurrentInterestText(data.currentInterestText || "");
          setPortfolioCompanies(data.portfolioCompanies || []);
          setValueAdd(data.valueAdd || []);
          setGeoPreferences(data.geoPreferences || "");
          setInvestmentStyle(data.investmentStyle || "");
          setDecisionSpeed(data.decisionSpeed || "");
          setFollowOnCapacity(data.followOnCapacity || "");
          setLocation(data.location || "");
          setLinkedIn(data.linkedIn || "");
          setTwitter(data.twitter || "");
        }
      } catch (err) {
        console.error("Failed to load investor profile:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [userEmail, userName, userImage]);

  // GSAP animations on tab change
  useEffect(() => {
    if (loading) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".animate-item",
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45, stagger: 0.06, ease: "power2.out" }
      );
    }, containerRef);
    return () => ctx.revert();
  }, [loading, activeTab]);

  // Save profile POST handler
  const handleSave = async () => {
    setSaving(true);
    setSavedSuccess(false);

    try {
      if (!userEmail) throw new Error("Please sign in before saving your profile.");
      const activeEmail = userEmail;
      const payload = {
        email: activeEmail,
        username,
        name,
        firm,
        role,
        avatarUrl,
        investorType,
        thesis,
        focusSectors,
        preferredStages,
        preferredInstruments,
        minCheckSize,
        maxCheckSize,
        checkSize: `${minCheckSize} - ${maxCheckSize}`,
        activityStatus,
        isLeadInvestor,
        followsOn,
        businessPreferences,
        riskAppetite,
        previousExits: parseInt(previousExits) || 0,
        currentInterestText,
        portfolioCompanies,
        portfolioCount: portfolioCompanies.length,
        valueAdd,
        geoPreferences,
        investmentStyle,
        decisionSpeed,
        followOnCapacity,
        location,
        linkedIn,
        twitter,
        verified: true,
      };

      const res = await fetch("/api/investors/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as any;
      if (res.ok && data.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      } else {
        alert("Failed to save changes.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving settings.");
    } finally {
      setSaving(false);
    }
  };

  // Helper toggle functions
  const toggleArrayItem = (list: string[], setList: (l: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const addSector = () => {
    if (newSector.trim() && !focusSectors.includes(newSector.trim())) {
      setFocusSectors([...focusSectors, newSector.trim()]);
      setNewSector("");
      setShowSectorInput(false);
    }
  };

  const addPortfolio = () => {
    if (newPortfolio.trim() && !portfolioCompanies.includes(newPortfolio.trim())) {
      setPortfolioCompanies([...portfolioCompanies, newPortfolio.trim()]);
      setNewPortfolio("");
      setShowPortfolioInput(false);
    }
  };

  const addValueAdd = () => {
    if (newValueAdd.trim() && !valueAdd.includes(newValueAdd.trim())) {
      setValueAdd([...valueAdd, newValueAdd.trim()]);
      setNewValueAdd("");
      setShowValueAddInput(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-[#c5c9b2] text-sm">
        <div className="flex items-center gap-3 bg-[#191919] border border-white/10 px-6 py-4 rounded-2xl">
          <div className="w-5 h-5 border-2 border-[#ccf063] border-t-transparent rounded-full animate-spin" />
          <span>Loading Edit Profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-6 max-w-7xl mx-auto font-sans px-4 sm:px-8 py-8 pb-16">
      {/* Toast Notification */}
      {savedSuccess && (
        <div className="fixed top-6 right-6 z-50 bg-[#ccf063] text-black px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 font-bold text-xs animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-black" />
          <span>Profile saved successfully!</span>
        </div>
      )}

      {/* Header Bar */}
      <header className="flex justify-between items-center border-b border-white/5 pb-4 gap-4">
        <div className="flex items-center gap-3 animate-item">
          <button
            onClick={() => router.push("/investor/profile")}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-all flex items-center justify-center"
            title="Back to Profile"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Edit Investor Profile</h1>
            <p className="text-xs text-neutral-400">Configure how you present your parameters and track-record to startups.</p>
          </div>
        </div>
        <div className="animate-item flex gap-3 text-xs font-bold shrink-0">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-lg bg-[#ccf063] text-black hover:shadow-[0_0_24px_rgba(212,249,106,0.3)] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 space-y-2 animate-item">
          {[
            { id: "profile", label: "Identity & Thesis", icon: User },
            { id: "matching", label: "Focus & Matching", icon: Sliders },
            { id: "deal", label: "Deal Style & Portfolio", icon: Briefcase },
            { id: "social", label: "Social Links", icon: Globe },
          ].map((tab) => {
            const Icon = tab.icon;
            const isTabActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all ${
                  isTabActive
                    ? "bg-[#ccf063] text-black shadow-md font-bold"
                    : "text-white/60 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                <Icon className={`w-4 h-4 ${isTabActive ? "text-black" : "text-white/40"}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Form Container */}
        <div className="lg:col-span-9 bg-[#1f1f1f] border border-white/10 rounded-2xl p-6 lg:p-8 space-y-8 min-h-[480px]">
          
          {/* TAB 1: Profile Identity */}
          {activeTab === "profile" && (
            <div className="space-y-6 animate-item">
              <div className="flex justify-between items-center pb-3 border-b border-white/5">
                <h3 className="text-base font-bold text-white font-serif">Investor Identity & Thesis</h3>
                <span className="text-[10px] text-[#ccf063] bg-[#ccf063]/10 px-2.5 py-1 rounded-full font-bold uppercase">Must-Haves</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="text-[#c5c9b2] uppercase font-bold tracking-wider text-[9px]">Username *</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                    className="w-full bg-[#131313] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:border-[#ccf063] outline-none"
                    placeholder="e.g. angel_investor"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[#c5c9b2] uppercase font-bold tracking-wider text-[9px]">Full Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#131313] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:border-[#ccf063] outline-none"
                    placeholder="e.g. Himanshu"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[#c5c9b2] uppercase font-bold tracking-wider text-[9px]">Firm / Syndicate Name *</label>
                  <input
                    type="text"
                    value={firm}
                    onChange={(e) => setFirm(e.target.value)}
                    className="w-full bg-[#131313] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:border-[#ccf063] outline-none"
                    placeholder="e.g. Apex Horizon Capital"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[#c5c9b2] uppercase font-bold tracking-wider text-[9px]">Role Title *</label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-[#131313] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:border-[#ccf063] outline-none"
                    placeholder="e.g. Managing Partner"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label className="text-[#c5c9b2] uppercase font-bold tracking-wider text-[9px]">Profile photo</label>
                  <div className="flex items-center gap-3">
                    {avatarUrl ? <img src={avatarUrl} alt={name || "Profile photo"} className="w-12 h-12 rounded-full object-cover border border-[#ccf063]/60" /> : <div className="w-12 h-12 rounded-full bg-[#ccf063]/10 border border-[#ccf063]/60 flex items-center justify-center text-[#ccf063] font-bold">{(name || "?").slice(0, 1).toUpperCase()}</div>}
                    <label className="cursor-pointer inline-flex items-center gap-2 rounded-lg border border-[#ccf063]/40 px-3 py-2 text-xs font-semibold text-[#ccf063] hover:bg-[#ccf063]/10 transition-colors">
                      {uploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                      {uploadingPhoto ? "Uploading..." : "Change photo"}
                      <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" disabled={uploadingPhoto} onChange={(event) => { const file = event.target.files?.[0]; if (file) handlePhotoUpload(file); event.currentTarget.value = ""; }} />
                    </label>
                    <span className="text-[10px] text-white/40">JPG, PNG, WebP or GIF · max 5 MB</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[#c5c9b2] uppercase font-bold tracking-wider text-[9px]">Location *</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-[#131313] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:border-[#ccf063] outline-none"
                    placeholder="e.g. San Francisco, CA"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[#c5c9b2] uppercase font-bold tracking-wider text-[9px]">Investor Type *</label>
                  <select
                    value={investorType}
                    onChange={(e) => setInvestorType(e.target.value)}
                    className="w-full bg-[#131313] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:border-[#ccf063] outline-none"
                  >
                    <option value="Individual Angel">Individual Angel</option>
                    <option value="Syndicate">Syndicate</option>
                    <option value="Micro-VC">Micro-VC</option>
                    <option value="Family Office">Family Office</option>
                    <option value="Institutional VC">Institutional VC</option>
                  </select>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[#c5c9b2] uppercase font-bold tracking-wider text-[9px]">Activity Status *</label>
                  <select
                    value={activityStatus}
                    onChange={(e) => setActivityStatus(e.target.value)}
                    className="w-full bg-[#131313] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:border-[#ccf063] outline-none"
                  >
                    <option value="Actively deploying this quarter">Actively deploying this quarter</option>
                    <option value="Evaluating select deals">Evaluating select deals</option>
                    <option value="Dormant / Capital deployed">Dormant / Capital deployed</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <label className="text-[#c5c9b2] uppercase font-bold tracking-wider text-[9px]">Investment Thesis / Bio *</label>
                <textarea
                  rows={4}
                  value={thesis}
                  onChange={(e) => setThesis(e.target.value)}
                  className="w-full bg-[#131313] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#ccf063] outline-none leading-relaxed"
                  placeholder="Describe your thesis, value-add and track-record..."
                />
              </div>

              <div className="space-y-1 text-xs">
                <label className="text-[#c5c9b2] uppercase font-bold tracking-wider text-[9px]">Current Interests (What are you actively looking for?)</label>
                <textarea
                  rows={2}
                  value={currentInterestText}
                  onChange={(e) => setCurrentInterestText(e.target.value)}
                  className="w-full bg-[#131313] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#ccf063] outline-none leading-relaxed"
                  placeholder="e.g. Seed stage SaaS and technical AI-infra startups with ARR above $200k..."
                />
              </div>
            </div>
          )}

          {/* TAB 2: Matching Parameters */}
          {activeTab === "matching" && (
            <div className="space-y-6 animate-item">
              <div className="flex justify-between items-center pb-3 border-b border-white/5">
                <h3 className="text-base font-bold text-white font-serif">Focus & Matching Parameters</h3>
                <span className="text-[10px] text-neutral-400 bg-white/5 px-2.5 py-1 rounded-full font-bold uppercase">Matching System</span>
              </div>

              <div className="space-y-4 text-xs">
                {/* Focus Sectors */}
                <div className="space-y-2">
                  <p className="text-[#c5c9b2] text-[9px] uppercase font-bold tracking-wider">Investment Focus Sectors *</p>
                  <div className="flex flex-wrap gap-2">
                    {focusSectors.map((sector) => (
                      <span
                        key={sector}
                        className="bg-[#ccf063]/10 border border-[#ccf063]/30 text-[#ccf063] px-2.5 py-1 rounded-full text-[10px] flex items-center gap-1.5 font-semibold"
                      >
                        {sector}
                        <button type="button" onClick={() => setFocusSectors(focusSectors.filter(s => s !== sector))}>
                          <X className="w-3 h-3 hover:text-white" />
                        </button>
                      </span>
                    ))}
                    {showSectorInput ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={newSector}
                          onChange={(e) => setNewSector(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSector())}
                          placeholder="e.g. AI/ML"
                          className="bg-black border border-[#ccf063] text-white px-3 py-1 rounded-full text-[10px] outline-none w-24"
                          autoFocus
                        />
                        <button type="button" onClick={addSector} className="text-[#ccf063] text-[10px] font-bold px-1.5">Add</button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowSectorInput(true)}
                        className="bg-black/40 border border-dashed border-white/20 text-[#c5c9b2] px-2.5 py-1 rounded-full text-[10px] flex items-center gap-1 hover:border-[#ccf063] transition-colors"
                      >
                        <Plus className="w-3 h-3" /> Add Sector
                      </button>
                    )}
                  </div>
                </div>

                {/* Preferred Stages */}
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <p className="text-[#c5c9b2] text-[9px] uppercase font-bold tracking-wider">Preferred Stages *</p>
                  <div className="flex flex-wrap gap-1.5">
                    {["Pre-Seed", "Seed", "Series A", "Series B", "Series C", "Growth"].map((stage) => {
                      const isSelected = preferredStages.includes(stage);
                      return (
                        <span
                          key={stage}
                          onClick={() => toggleArrayItem(preferredStages, setPreferredStages, stage)}
                          className={`px-3 py-1 rounded-full text-[10px] font-semibold cursor-pointer transition-all ${
                            isSelected
                              ? "bg-[#ccf063] text-black shadow-sm"
                              : "bg-black/50 border border-white/10 text-neutral-400 hover:border-white/30"
                          }`}
                        >
                          {stage}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Business Model Preferences */}
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <p className="text-[#c5c9b2] text-[9px] uppercase font-bold tracking-wider">Business Model Preferences *</p>
                  <div className="flex flex-wrap gap-1.5">
                    {["B2B", "B2C", "SaaS", "Marketplace", "DeepTech", "Hardware", "Consumer", "D2C", "Enterprise"].map((model) => {
                      const isSelected = businessPreferences.includes(model);
                      return (
                        <span
                          key={model}
                          onClick={() => toggleArrayItem(businessPreferences, setBusinessPreferences, model)}
                          className={`px-3 py-1 rounded-full text-[10px] font-semibold cursor-pointer transition-all ${
                            isSelected
                              ? "bg-[#ccf063] text-black shadow-sm"
                              : "bg-black/50 border border-white/10 text-neutral-400 hover:border-white/30"
                          }`}
                        >
                          {model}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Preferred Instruments */}
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <p className="text-[#c5c9b2] text-[9px] uppercase font-bold tracking-wider">Preferred Investment Instruments *</p>
                  <div className="flex flex-wrap gap-1.5">
                    {["SAFE", "Priced Equity", "Convertible Note", "Debt"].map((inst) => {
                      const isSelected = preferredInstruments.includes(inst);
                      return (
                        <span
                          key={inst}
                          onClick={() => toggleArrayItem(preferredInstruments, setPreferredInstruments, inst)}
                          className={`px-3 py-1 rounded-full text-[10px] font-semibold cursor-pointer transition-all ${
                            isSelected
                              ? "bg-[#ccf063] text-black shadow-sm"
                              : "bg-black/50 border border-white/10 text-neutral-400 hover:border-white/30"
                          }`}
                        >
                          {inst}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Check Sizes & Geography */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/5">
                  <div className="space-y-1">
                    <label className="text-[#c5c9b2] uppercase font-bold tracking-wider text-[9px]">Min Check Size *</label>
                    <input
                      type="text"
                      value={minCheckSize}
                      onChange={(e) => setMinCheckSize(e.target.value)}
                      className="w-full bg-[#131313] border border-white/10 rounded-xl px-3 py-2 text-white font-bold text-center focus:border-[#ccf063] outline-none"
                      placeholder="e.g. $50K"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[#c5c9b2] uppercase font-bold tracking-wider text-[9px]">Max Check Size *</label>
                    <input
                      type="text"
                      value={maxCheckSize}
                      onChange={(e) => setMaxCheckSize(e.target.value)}
                      className="w-full bg-[#131313] border border-white/10 rounded-xl px-3 py-2 text-white font-bold text-center focus:border-[#ccf063] outline-none"
                      placeholder="e.g. $250K"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[#c5c9b2] uppercase font-bold tracking-wider text-[9px]">Geography Preference *</label>
                    <input
                      type="text"
                      value={geoPreferences}
                      onChange={(e) => setGeoPreferences(e.target.value)}
                      className="w-full bg-[#131313] border border-white/10 rounded-xl px-3.5 py-2 text-white focus:border-[#ccf063] outline-none"
                      placeholder="e.g. US, Europe, India"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Deal Style & Strategic */}
          {activeTab === "deal" && (
            <div className="space-y-6 animate-item">
              <div className="flex justify-between items-center pb-3 border-b border-white/5">
                <h3 className="text-base font-bold text-white font-serif">Deal Style, Portfolio & Value-Add</h3>
                <span className="text-[10px] text-neutral-400 bg-white/5 px-2.5 py-1 rounded-full font-bold uppercase">Operational</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="text-[#c5c9b2] uppercase font-bold tracking-wider text-[9px]">Investment Style *</label>
                  <select
                    value={investmentStyle}
                    onChange={(e) => setInvestmentStyle(e.target.value)}
                    className="w-full bg-[#131313] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:border-[#ccf063] outline-none"
                  >
                    <option value="Active Lead / Board Observer">Active Lead / Board Observer</option>
                    <option value="Active Co-Investor">Active Co-Investor</option>
                    <option value="Passive Participant">Passive Participant</option>
                    <option value="Flexible">Flexible</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[#c5c9b2] uppercase font-bold tracking-wider text-[9px]">Decision Speed *</label>
                  <input
                    type="text"
                    value={decisionSpeed}
                    onChange={(e) => setDecisionSpeed(e.target.value)}
                    className="w-full bg-[#131313] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:border-[#ccf063] outline-none"
                    placeholder="e.g. 1-2 weeks"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[#c5c9b2] uppercase font-bold tracking-wider text-[9px]">Follow-on Capital Capacity</label>
                  <input
                    type="text"
                    value={followOnCapacity}
                    onChange={(e) => setFollowOnCapacity(e.target.value)}
                    className="w-full bg-[#131313] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:border-[#ccf063] outline-none"
                    placeholder="e.g. Yes - 50% pro-rata reserved"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[#c5c9b2] uppercase font-bold tracking-wider text-[9px]">Previous Exits</label>
                  <input
                    type="number"
                    value={previousExits}
                    onChange={(e) => setPreviousExits(e.target.value)}
                    className="w-full bg-[#131313] border border-white/10 rounded-xl px-3.5 py-2 text-white focus:border-[#ccf063] outline-none font-bold text-center"
                    placeholder="e.g. 0"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[#c5c9b2] uppercase font-bold tracking-wider text-[9px]">Risk Appetite</label>
                  <select
                    value={riskAppetite}
                    onChange={(e) => setRiskAppetite(e.target.value)}
                    className="w-full bg-[#131313] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:border-[#ccf063] outline-none font-bold text-center"
                  >
                    <option value="Conservative">Conservative</option>
                    <option value="Moderate">Moderate</option>
                    <option value="High">High</option>
                    <option value="Moonshot">Moonshot</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="flex items-center justify-between p-3 bg-black/40 border border-white/5 rounded-xl">
                    <span className="text-[10px] text-[#c5c9b2] uppercase font-bold">Leads Rounds?</span>
                    <button
                      type="button"
                      onClick={() => setIsLeadInvestor(!isLeadInvestor)}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors ${isLeadInvestor ? "bg-[#ccf063]" : "bg-white/10"}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-black transition-transform ${isLeadInvestor ? "translate-x-4" : "translate-x-0"}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-black/40 border border-white/5 rounded-xl">
                    <span className="text-[10px] text-[#c5c9b2] uppercase font-bold">Follows On?</span>
                    <button
                      type="button"
                      onClick={() => setFollowsOn(!followsOn)}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors ${followsOn ? "bg-[#ccf063]" : "bg-white/10"}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-black transition-transform ${followsOn ? "translate-x-4" : "translate-x-0"}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Value Add Tactic Items */}
              <div className="space-y-2 text-xs pt-4 border-t border-white/5">
                <p className="text-[#c5c9b2] text-[9px] uppercase font-bold tracking-wider">Value Add Bullet Points</p>
                <div className="space-y-2">
                  {valueAdd.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-black/30 border border-white/5 rounded-xl">
                      <span className="text-white">{item}</span>
                      <button type="button" onClick={() => setValueAdd(valueAdd.filter((_, idx) => idx !== i))}>
                        <X className="w-4 h-4 text-white/40 hover:text-white" />
                      </button>
                    </div>
                  ))}
                  {showValueAddInput ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newValueAdd}
                        onChange={(e) => setNewValueAdd(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addValueAdd())}
                        placeholder="e.g. GTM Strategy advisory..."
                        className="flex-1 bg-[#131313] border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none"
                        autoFocus
                      />
                      <button type="button" onClick={addValueAdd} className="px-3 bg-[#ccf063] text-black text-xs font-bold rounded-xl">Add</button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowValueAddInput(true)}
                      className="bg-black/40 border border-dashed border-white/20 text-[#c5c9b2] px-3 py-2 rounded-xl text-xs flex items-center gap-1 hover:border-[#ccf063] transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Strategic Value Add
                    </button>
                  )}
                </div>
              </div>

              {/* Portfolio Companies */}
              <div className="space-y-2 text-xs pt-4 border-t border-white/5">
                <p className="text-[#c5c9b2] text-[9px] uppercase font-bold tracking-wider">Portfolio Companies</p>
                <div className="flex flex-wrap gap-2">
                  {portfolioCompanies.map((company) => (
                    <span
                      key={company}
                      className="bg-black/60 border border-white/15 text-white px-3 py-1.5 rounded-xl text-xs flex items-center gap-2"
                    >
                      <Building2 className="w-3.5 h-3.5 text-[#ccf063]" /> {company}
                      <button type="button" onClick={() => setPortfolioCompanies(portfolioCompanies.filter(c => c !== company))}>
                        <X className="w-3 h-3 hover:text-red-400" />
                      </button>
                    </span>
                  ))}
                  {showPortfolioInput ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={newPortfolio}
                        onChange={(e) => setNewPortfolio(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addPortfolio())}
                        placeholder="Company name..."
                        className="bg-black border border-[#ccf063] text-white px-3 py-1 rounded-xl text-xs outline-none w-28"
                        autoFocus
                      />
                      <button type="button" onClick={addPortfolio} className="text-[#ccf063] text-xs font-bold px-1.5">Add</button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowPortfolioInput(true)}
                      className="bg-black/40 border border-dashed border-white/20 text-[#c5c9b2] px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 hover:border-[#ccf063] transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Portfolio Company
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Social Links */}
          {activeTab === "social" && (
            <div className="space-y-6 animate-item">
              <div className="flex justify-between items-center pb-3 border-b border-white/5">
                <h3 className="text-base font-bold text-white font-serif">Social Profiles</h3>
                <span className="text-[10px] text-neutral-400 bg-white/5 px-2.5 py-1 rounded-full font-bold uppercase">Online Presence</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                <div className="space-y-1">
                  <label className="text-[#c5c9b2] uppercase font-bold tracking-wider text-[9px]">LinkedIn Profile URL</label>
                  <div className="relative">
                    <Globe className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="text"
                      value={linkedIn}
                      onChange={(e) => setLinkedIn(e.target.value)}
                      className="w-full bg-[#131313] border border-white/10 rounded-xl pl-9 pr-3.5 py-2.5 text-white focus:border-[#ccf063] outline-none"
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[#c5c9b2] uppercase font-bold tracking-wider text-[9px]">Twitter / X Handle</label>
                  <div className="relative">
                    <Share2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="text"
                      value={twitter}
                      onChange={(e) => setTwitter(e.target.value)}
                      className="w-full bg-[#131313] border border-white/10 rounded-xl pl-9 pr-3.5 py-2.5 text-white focus:border-[#ccf063] outline-none"
                      placeholder="https://x.com/..."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
