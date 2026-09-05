"use client";

import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  Save,
  Check,
  X,
  Plus,
  Zap,
  Globe,
  Briefcase,
  Clock,
  Cpu,
  Link as LinkIcon,
  Share2,
  Award,
  DollarSign,
  Building2,
  UserCheck,
  Activity,
  Layers,
  ChevronLeft,
  User,
  Sliders,
  AlertTriangle,
  Camera,
  Loader2
} from "lucide-react";

export default function InvestorProfilePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { userEmail, userName, userImage } = useAuth();
  const [activeTab, setActiveTab] = useState<"profile" | "matching" | "deal" | "danger">("profile");

  // Loading & Database Sync States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [dbConnected, setDbConnected] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handlePhotoUpload = async (file: File) => {
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const configRes = await fetch("/api/upload-config");
      const config = await configRes.json() as any;
      const workerUrl = config.workerUrl || "";
      const workerSecret = config.workerSecret || "";
      if (!workerUrl) throw new Error("Upload not configured");
      const fileKey = `avatars/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
      const uploadUrl = `${workerUrl}/${fileKey}`;
      const res = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${workerSecret}`, "Content-Type": file.type },
        body: file
      });
      if (!res.ok) throw new Error("Upload failed");
      setAvatarUrl(uploadUrl);
    } catch (e) {
      console.error("Photo upload failed:", e);
      const blobUrl = URL.createObjectURL(file);
      setAvatarUrl(blobUrl);
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Must-Haves Form States
  const [name, setName] = useState("Himanshu");
  const [firm, setFirm] = useState("");
  const [role, setRole] = useState("Managing Partner");
  const [avatarUrl, setAvatarUrl] = useState(userImage || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250");
  const [investorType, setInvestorType] = useState("Micro-VC");
  const [thesis, setThesis] = useState(
    "Backing ambitious technical founders building high-margin AI infrastructure and next-gen enterprise tools."
  );
  const [focusSectors, setFocusSectors] = useState<string[]>(["AI/ML", "DeepTech", "FinTech", "SaaS"]);
  const [preferredStages, setPreferredStages] = useState<string[]>(["Pre-Seed", "Seed", "Series A"]);
  const [preferredInstruments, setPreferredInstruments] = useState<string[]>(["SAFE", "Priced Equity"]);
  const [minCheckSize, setMinCheckSize] = useState("$100K");
  const [maxCheckSize, setMaxCheckSize] = useState("$500K");
  const [accreditationStatus, setAccreditationStatus] = useState("Accredited Investor (Verified)");
  const [activityStatus, setActivityStatus] = useState("Actively deploying this quarter");
  const [isLeadInvestor, setIsLeadInvestor] = useState(false);
  const [followsOn, setFollowsOn] = useState(false);
  const [businessPreferences, setBusinessPreferences] = useState<string[]>(["B2B", "SaaS"]);
  const [riskAppetite, setRiskAppetite] = useState("Moderate");
  const [previousExits, setPreviousExits] = useState("0");
  const [currentInterestText, setCurrentInterestText] = useState("");
  const [autonomousEnabled, setAutonomousEnabled] = useState(true);

  // Nice-To-Haves Form States
  const [portfolioCompanies, setPortfolioCompanies] = useState<string[]>([]);
  const [valueAdd, setValueAdd] = useState<string[]>([
    "GTM Strategy & Enterprise Sales Loop",
    "Engineering Recruitment Network",
    "Follow-on Capital Connections"
  ]);
  const [geoPreferences, setGeoPreferences] = useState("Global (US, Europe, India)");
  const [investmentStyle, setInvestmentStyle] = useState("Active Lead / Board Observer");
  const [decisionSpeed, setDecisionSpeed] = useState("1-2 weeks");
  const [followOnCapacity, setFollowOnCapacity] = useState("Yes - 50% pro-rata reserved");
  const [responseRate, setResponseRate] = useState("99%");
  const [trustScore, setTrustScore] = useState("9.9/10");
  const [location, setLocation] = useState("San Francisco, CA");
  const [linkedIn, setLinkedIn] = useState("https://linkedin.com/in/himanshu");
  const [twitter, setTwitter] = useState("https://x.com/himanshu");

  // Input Helper States
  const [newSector, setNewSector] = useState("");
  const [showSectorInput, setShowSectorInput] = useState(false);
  const [newPortfolio, setNewPortfolio] = useState("");
  const [showPortfolioInput, setShowPortfolioInput] = useState(false);

  // Fetch Profile from Azure PostgreSQL DB on Load
  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      try {
        const activeEmail = userEmail || "himanshu25b@gmail.com";
        const res = await fetch(`/api/investors/profile?email=${encodeURIComponent(activeEmail)}`);
        const result = (await res.json()) as any;

        if (result.success && result.data) {
          const data = result.data;
          setName(data.name || userName || "Himanshu");
          setFirm(data.firm || "");
          setRole(data.role || "Managing Partner");
          setAvatarUrl(data.avatarUrl || userImage || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250");
          setInvestorType(data.investorType || "Micro-VC");
          setThesis(data.thesis || "Backing ambitious technical founders building high-margin AI infrastructure.");
          if (data.focusSectors?.length) setFocusSectors(data.focusSectors);
          if (data.preferredStages?.length) setPreferredStages(data.preferredStages);
          if (data.preferredInstruments?.length) setPreferredInstruments(data.preferredInstruments);
          setMinCheckSize(data.minCheckSize || "$100K");
          setMaxCheckSize(data.maxCheckSize || "$500K");
          setAccreditationStatus(data.accreditationStatus || "Accredited Investor (Verified)");
          setActivityStatus(data.activityStatus || "Actively deploying this quarter");
          setAutonomousEnabled(data.autonomousEnabled !== false);
          if (data.isLeadInvestor !== undefined) setIsLeadInvestor(data.isLeadInvestor);
          if (data.followsOn !== undefined) setFollowsOn(data.followsOn);
          if (data.businessPreferences?.length) setBusinessPreferences(data.businessPreferences);
          if (data.riskAppetite) setRiskAppetite(data.riskAppetite);
          if (data.previousExits !== undefined) setPreviousExits(data.previousExits.toString());
          if (data.currentInterestText) setCurrentInterestText(data.currentInterestText);

          if (data.portfolioCompanies?.length) setPortfolioCompanies(data.portfolioCompanies);
          if (data.valueAdd?.length) setValueAdd(data.valueAdd);
          if (data.geoPreferences) setGeoPreferences(data.geoPreferences);
          if (data.investmentStyle) setInvestmentStyle(data.investmentStyle);
          if (data.decisionSpeed) setDecisionSpeed(data.decisionSpeed);
          if (data.followOnCapacity) setFollowOnCapacity(data.followOnCapacity);
          if (data.responseRate) setResponseRate(data.responseRate);
          if (data.trustScore) setTrustScore(data.trustScore);
          if (data.location) setLocation(data.location);
          if (data.linkedIn) setLinkedIn(data.linkedIn);
          if (data.twitter) setTwitter(data.twitter);
          setDbConnected(true);
        }
      } catch (err) {
        console.error("Failed to load investor profile from DB:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [userEmail, userName]);

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
  }, [loading, activeTab]);

  // Save Settings to Azure PostgreSQL DB
  const handleSave = async () => {
    setSaving(true);
    setSavedSuccess(false);

    try {
      const activeEmail = userEmail || "himanshu25b@gmail.com";
      const payload = {
        email: activeEmail,
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
        accreditationStatus,
        activityStatus,
        isLeadInvestor,
        followsOn,
        businessPreferences,
        riskAppetite,
        previousExits: parseInt(previousExits) || 0,
        currentInterestText,
        autonomousEnabled,
        portfolioCompanies,
        portfolioCount: portfolioCompanies.length,
        valueAdd,
        geoPreferences,
        investmentStyle,
        decisionSpeed,
        followOnCapacity,
        responseRate,
        trustScore,
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
        alert("Failed to save to PostgreSQL database.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving settings.");
    } finally {
      setSaving(false);
    }
  };

  const addSector = () => {
    if (newSector.trim() && !focusSectors.includes(newSector.trim())) {
      setFocusSectors([...focusSectors, newSector.trim()]);
      setNewSector("");
      setShowSectorInput(false);
    }
  };

  const removeSector = (sector: string) => {
    setFocusSectors(focusSectors.filter((s) => s !== sector));
  };

  const addPortfolio = () => {
    if (newPortfolio.trim() && !portfolioCompanies.includes(newPortfolio.trim())) {
      setPortfolioCompanies([...portfolioCompanies, newPortfolio.trim()]);
      setNewPortfolio("");
      setShowPortfolioInput(false);
    }
  };

  const removePortfolio = (company: string) => {
    setPortfolioCompanies(portfolioCompanies.filter((c) => c !== company));
  };

  const toggleArrayItem = (list: string[], setList: (l: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else {
      setList([...list, item]);
    }
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
    <div ref={containerRef} className="space-y-8 max-w-7xl mx-auto font-sans px-4 sm:px-8 py-8 pb-16">
      
      {/* Header Bar: Back Button + Title */}
      <header className="flex justify-between items-center border-b border-white/5 pb-4 gap-4">
        <div className="flex items-center gap-3 animate-item">
          <button
            onClick={() => router.push("/investor/feed")}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-all flex items-center justify-center"
            title="Back to Workspace"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-white tracking-tight">Settings</h1>
            <span className="bg-[#ccf063]/10 text-[#ccf063] border border-[#ccf063]/30 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" /> {accreditationStatus}
            </span>
          </div>
        </div>
        <div className="animate-item flex items-center gap-3 shrink-0">
          {savedSuccess && (
            <span className="text-xs text-lime-400 font-bold flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" /> Updated!
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-lg bg-[#ccf063] text-black font-bold text-xs hover:shadow-[0_0_24px_rgba(212,249,106,0.3)] disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
          >
            <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </header>

      {/* Settings Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Hand Navigation Menu */}
        <div className="lg:col-span-3 space-y-2 animate-item">
          {(
            [
              { id: "deal", label: "Deal Settings", icon: Briefcase },
              { id: "danger", label: "Danger Zone", icon: AlertTriangle },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const isTabActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
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

        {/* Right Content Column */}
        <div className="lg:col-span-9 bg-[#1f1f1f] border border-white/10 rounded-2xl p-6 lg:p-8 space-y-8 min-h-[480px]">
          
          {/* TAB 1: Profile & Account Settings */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#ccf063]" />
                  <h3 className="text-lg font-bold text-white font-serif">Investor Identity & Credentials</h3>
                </div>
                <span className="text-[10px] text-[#ccf063] bg-[#ccf063]/10 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                  Must-Haves
                </span>
              </div>

              {/* Profile Avatar & Header Info */}
              <div className="flex items-center gap-4 bg-black/40 p-4 rounded-xl border border-white/5 animate-item">
                <div className="relative group shrink-0">
                  <img
                    src={avatarUrl}
                    alt={name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-[#ccf063]"
                  />
                  <label className="absolute inset-0 flex items-center justify-center rounded-full cursor-pointer bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                    <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f); }} />
                    {uploadingPhoto ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
                  </label>
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-white">{name}</h4>
                    <span className="text-xs text-[#c5c9b2]">({role})</span>
                  </div>
                  <p className="text-xs text-[#ccf063] font-semibold">{firm}</p>
                  <p className="text-[11px] text-neutral-400">{location} • {investorType}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs animate-item">
                <div className="space-y-1">
                  <label className="text-[#c5c9b2] uppercase font-bold tracking-wider text-[9px]">Full Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#131313] border border-[#454937]/50 rounded-xl px-3.5 py-2.5 text-white focus:border-[#ccf063] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[#c5c9b2] uppercase font-bold tracking-wider text-[9px]">Syndicate / Fund Name *</label>
                  <input
                    type="text"
                    value={firm}
                    onChange={(e) => setFirm(e.target.value)}
                    className="w-full bg-[#131313] border border-[#454937]/50 rounded-xl px-3.5 py-2.5 text-white focus:border-[#ccf063] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[#c5c9b2] uppercase font-bold tracking-wider text-[9px]">Investor Type (Primary Filter) *</label>
                  <select
                    value={investorType}
                    onChange={(e) => setInvestorType(e.target.value)}
                    className="w-full bg-[#131313] border border-[#454937]/50 rounded-xl px-3.5 py-2.5 text-white focus:border-[#ccf063] outline-none"
                  >
                    <option value="Individual Angel">Individual Angel</option>
                    <option value="Syndicate">Syndicate</option>
                    <option value="Micro-VC">Micro-VC</option>
                    <option value="Family Office">Family Office</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[#c5c9b2] uppercase font-bold tracking-wider text-[9px]">Activity Status *</label>
                  <select
                    value={activityStatus}
                    onChange={(e) => setActivityStatus(e.target.value)}
                    className="w-full bg-[#131313] border border-[#454937]/50 rounded-xl px-3.5 py-2.5 text-white focus:border-[#ccf063] outline-none"
                  >
                    <option value="Actively deploying this quarter">Actively deploying this quarter</option>
                    <option value="Evaluating select deals">Evaluating select deals</option>
                    <option value="Dormant / Capital deployed">Dormant / Capital deployed</option>
                  </select>
                </div>
              </div>

              {/* Investment Thesis */}
              <div className="space-y-1 text-xs animate-item">
                <label className="text-[#c5c9b2] uppercase font-bold tracking-wider text-[9px]">Investment Thesis / Bio *</label>
                <textarea
                  rows={3}
                  value={thesis}
                  onChange={(e) => setThesis(e.target.value)}
                  className="w-full bg-[#131313] border border-[#454937]/50 rounded-xl px-4 py-3 text-white focus:border-[#ccf063] outline-none leading-relaxed"
                />
              </div>

              <div className="space-y-1 text-xs pt-4 border-t border-white/5 animate-item">
                <label className="text-[#c5c9b2] uppercase font-bold tracking-wider text-[9px]">Current Interests (What are you looking for right now?)</label>
                <textarea
                  rows={2}
                  value={currentInterestText}
                  onChange={(e) => setCurrentInterestText(e.target.value)}
                  className="w-full bg-[#131313] border border-[#454937]/50 rounded-xl px-4 py-3 text-white focus:border-[#ccf063] outline-none leading-relaxed"
                  placeholder="e.g. Looking for Seed stage AI infra startups..."
                />
              </div>
            </div>
          )}

          {/* TAB 2: Matching Preferences */}
          {activeTab === "matching" && (
            <div className="space-y-8">
              
              {/* Focus Sectors & Stages */}
              <div className="space-y-6">
                <div className="flex justify-between items-center pb-3 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-[#ccf063]" />
                    <h3 className="text-lg font-bold text-white font-serif">Matching Parameters</h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs animate-item">
                  <div className="space-y-2">
                    <p className="text-[#c5c9b2] text-[9px] uppercase font-bold tracking-wider">Investment Focus Sectors *</p>
                    <div className="flex flex-wrap gap-1.5">
                      {focusSectors.map((sector) => (
                        <span
                          key={sector}
                          className="bg-[#ccf063]/10 border border-[#ccf063]/30 text-[#ccf063] px-2.5 py-1 rounded-full text-[10px] flex items-center gap-1.5"
                        >
                          {sector}
                          <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => removeSector(sector)} />
                        </span>
                      ))}
                      {showSectorInput ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={newSector}
                            onChange={(e) => setNewSector(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSector())}
                            placeholder="Sector name..."
                            className="bg-black border border-[#ccf063] text-white px-2 py-0.5 rounded-full text-[10px] outline-none w-24"
                            autoFocus
                          />
                          <button onClick={addSector} className="text-[#ccf063] text-[10px] font-bold px-1">Add</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowSectorInput(true)}
                          className="bg-black/40 border border-dashed border-[#454937] text-[#c5c9b2] px-2.5 py-1 rounded-full text-[10px] flex items-center gap-1 hover:border-[#ccf063]"
                        >
                          <Plus className="w-3 h-3" /> Add Sector
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[#c5c9b2] text-[9px] uppercase font-bold tracking-wider">Preferred Stages *</p>
                    <div className="flex flex-wrap gap-1.5">
                      {["Pre-Seed", "Seed", "Series A", "Series B"].map((stage) => {
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

                  <div className="space-y-2 lg:col-span-2 pt-2 border-t border-white/5">
                    <p className="text-[#c5c9b2] text-[9px] uppercase font-bold tracking-wider">Business Model Preferences *</p>
                    <div className="flex flex-wrap gap-1.5">
                      {["B2B", "B2C", "SaaS", "Marketplace", "DeepTech", "Hardware", "Consumer"].map((model) => {
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
                </div>
              </div>

              {/* Deployment Parameters */}
              <div className="space-y-5 text-xs pt-6 border-t border-white/5 animate-item">
                <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                  <DollarSign className="w-4 h-4 text-[#ccf063]" />
                  <h3 className="text-sm font-bold text-[#ccf063] uppercase tracking-widest font-serif">
                    Deployment Parameters
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[#c5c9b2] text-[10px] uppercase font-bold tracking-wider">Preferred Instrument *</span>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {["SAFE", "Priced Equity", "Convertible Note"].map((inst) => {
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

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="space-y-1">
                      <label className="text-[#c5c9b2] uppercase font-bold tracking-wider text-[9px]">Min Check Size</label>
                      <input
                        type="text"
                        value={minCheckSize}
                        onChange={(e) => setMinCheckSize(e.target.value)}
                        className="w-full bg-[#131313] border border-[#454937]/50 rounded-xl px-3 py-2 text-white text-center font-bold focus:border-[#ccf063] outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[#c5c9b2] uppercase font-bold tracking-wider text-[9px]">Max Check Size</label>
                      <input
                        type="text"
                        value={maxCheckSize}
                        onChange={(e) => setMaxCheckSize(e.target.value)}
                        className="w-full bg-[#131313] border border-[#454937]/50 rounded-xl px-3 py-2 text-white text-center font-bold focus:border-[#ccf063] outline-none"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-black/50 rounded-xl border border-white/5 text-center">
                    <span className="text-[10px] text-[#c5c9b2] uppercase tracking-wider block">Target Check Range</span>
                    <span className="text-sm font-extrabold text-[#ccf063]">{minCheckSize} – {maxCheckSize}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
                    <div className="space-y-1">
                      <label className="text-[#c5c9b2] uppercase font-bold tracking-wider text-[9px]">Lead Investor?</label>
                      <select
                        value={isLeadInvestor ? "Yes" : "No"}
                        onChange={(e) => setIsLeadInvestor(e.target.value === "Yes")}
                        className="w-full bg-[#131313] border border-[#454937]/50 rounded-xl px-3 py-2 text-white text-center font-bold focus:border-[#ccf063] outline-none"
                      >
                        <option value="Yes">Yes, we lead rounds</option>
                        <option value="No">No, we participate</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[#c5c9b2] uppercase font-bold tracking-wider text-[9px]">Follow-on Capacity</label>
                      <select
                        value={followsOn ? "Yes" : "No"}
                        onChange={(e) => setFollowsOn(e.target.value === "Yes")}
                        className="w-full bg-[#131313] border border-[#454937]/50 rounded-xl px-3 py-2 text-white text-center font-bold focus:border-[#ccf063] outline-none"
                      >
                        <option value="Yes">Yes, we follow on</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
                    <div className="space-y-1">
                      <label className="text-[#c5c9b2] uppercase font-bold tracking-wider text-[9px]">Risk Appetite</label>
                      <select
                        value={riskAppetite}
                        onChange={(e) => setRiskAppetite(e.target.value)}
                        className="w-full bg-[#131313] border border-[#454937]/50 rounded-xl px-3 py-2 text-white text-center font-bold focus:border-[#ccf063] outline-none"
                      >
                        <option value="Conservative">Conservative</option>
                        <option value="Moderate">Moderate</option>
                        <option value="High">High</option>
                        <option value="Moonshot">Moonshot</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[#c5c9b2] uppercase font-bold tracking-wider text-[9px]">Previous Exits</label>
                      <input
                        type="number"
                        value={previousExits}
                        onChange={(e) => setPreviousExits(e.target.value)}
                        className="w-full bg-[#131313] border border-[#454937]/50 rounded-xl px-3 py-2 text-white text-center font-bold focus:border-[#ccf063] outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: Deal Settings & Strategic Value-Add */}
          {activeTab === "deal" && (
            <div className="space-y-8">
              
              {/* Strategic Value Add Card */}
              <div className="space-y-6">
                <div className="flex justify-between items-center pb-3 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-[#ccf063]" />
                    <h3 className="text-lg font-bold text-white font-serif">Portfolio & Strategic Value-Add</h3>
                  </div>
                  <span className="text-[10px] text-neutral-400 bg-white/5 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                    Nice-to-Haves
                  </span>
                </div>

                {/* Portfolio Examples */}
                <div className="space-y-2 text-xs animate-item">
                  <label className="text-[#c5c9b2] uppercase font-bold tracking-wider text-[9px]">Past Investments (Portfolio Companies)</label>
                  <div className="flex flex-wrap gap-2">
                    {portfolioCompanies.map((company) => (
                      <span
                        key={company}
                        className="bg-black/60 border border-white/15 text-white px-3 py-1.5 rounded-xl text-xs flex items-center gap-2"
                      >
                        <Building2 className="w-3.5 h-3.5 text-[#ccf063]" /> {company}
                        <X className="w-3 h-3 cursor-pointer hover:text-red-400" onClick={() => removePortfolio(company)} />
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
                        <button onClick={addPortfolio} className="text-[#ccf063] text-xs font-bold px-1">Add</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowPortfolioInput(true)}
                        className="bg-black/40 border border-dashed border-[#454937] text-[#c5c9b2] px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 hover:border-[#ccf063]"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Portfolio Company
                      </button>
                    )}
                  </div>
                </div>

                {/* Strategic Value Add */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-4 border-t border-white/5 animate-item">
                  <div className="space-y-1">
                    <label className="text-[#c5c9b2] uppercase font-bold tracking-wider text-[9px]">Geographic Preferences</label>
                    <input
                      type="text"
                      value={geoPreferences}
                      onChange={(e) => setGeoPreferences(e.target.value)}
                      className="w-full bg-[#131313] border border-[#454937]/50 rounded-xl px-3.5 py-2.5 text-white focus:border-[#ccf063] outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[#c5c9b2] uppercase font-bold tracking-wider text-[9px]">Investment Style</label>
                    <select
                      value={investmentStyle}
                      onChange={(e) => setInvestmentStyle(e.target.value)}
                      className="w-full bg-[#131313] border border-[#454937]/50 rounded-xl px-3.5 py-2.5 text-white focus:border-[#ccf063] outline-none"
                    >
                      <option value="Active Lead / Board Observer">Active Lead / Board Observer</option>
                      <option value="Active Co-Investor">Active Co-Investor</option>
                      <option value="Passive Participant">Passive Participant</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[#c5c9b2] uppercase font-bold tracking-wider text-[9px]">Decision Speed</label>
                    <input
                      type="text"
                      value={decisionSpeed}
                      onChange={(e) => setDecisionSpeed(e.target.value)}
                      className="w-full bg-[#131313] border border-[#454937]/50 rounded-xl px-3.5 py-2.5 text-white focus:border-[#ccf063] outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[#c5c9b2] uppercase font-bold tracking-wider text-[9px]">Follow-on Capacity</label>
                    <input
                      type="text"
                      value={followOnCapacity}
                      onChange={(e) => setFollowOnCapacity(e.target.value)}
                      className="w-full bg-[#131313] border border-[#454937]/50 rounded-xl px-3.5 py-2.5 text-white focus:border-[#ccf063] outline-none"
                    />
                  </div>
                </div>

                {/* Social Links */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-4 border-t border-white/5 animate-item">
                  <div className="space-y-1">
                    <label className="text-[#c5c9b2] uppercase font-bold tracking-wider text-[9px]">LinkedIn Profile</label>
                    <div className="relative">
                      <Globe className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                      <input
                        type="text"
                        value={linkedIn}
                        onChange={(e) => setLinkedIn(e.target.value)}
                        className="w-full bg-[#131313] border border-[#454937]/50 rounded-xl pl-9 pr-3.5 py-2.5 text-white focus:border-[#ccf063] outline-none"
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
                        className="w-full bg-[#131313] border border-[#454937]/50 rounded-xl pl-9 pr-3.5 py-2.5 text-white focus:border-[#ccf063] outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Autonomous AI Settings */}
              <div className="space-y-4 text-xs pt-6 border-t border-white/5 animate-item">
                <div className="flex items-center gap-2 mb-2">
                  <Cpu className="w-5 h-5 text-[#ccf063]" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest font-serif">Autonomous AI Diligence</h3>
                </div>
                <div className="flex items-start justify-between p-4 bg-[#ccf063]/5 border border-[#ccf063]/20 rounded-xl">
                  <div className="space-y-1 pr-4">
                    <p className="text-white font-bold text-sm">Proactive Recommendations</p>
                    <p className="text-[#c5c9b2] text-xs leading-relaxed">
                      Allow our AI Agents to autonomously screen the startup pipeline against your thesis and surface 1 high-conviction deal per day in your Discovery Feed. AI learns from your passes over time.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={autonomousEnabled}
                      onChange={(e) => setAutonomousEnabled(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ccf063]"></div>
                  </label>
                </div>
              </div>

              {/* Platform Trust & Response Score Card */}
              <div className="space-y-4 text-xs pt-6 border-t border-white/5 animate-item">
                <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                  <Zap className="w-4 h-4 text-[#ccf063]" />
                  <h3 className="text-sm font-bold text-[#ccf063] uppercase tracking-widest font-serif">
                    Platform Trust & Metrics
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-black/50 p-3.5 rounded-xl border border-white/5 space-y-1 text-center">
                    <span className="text-[10px] text-[#c5c9b2] uppercase tracking-wider block">Response Rate</span>
                    <span className="text-lg font-bold text-white">{responseRate}</span>
                    <span className="text-[9px] text-lime-400 block font-semibold">Top 5% on platform</span>
                  </div>
                  <div className="bg-black/50 p-3.5 rounded-xl border border-white/5 space-y-1 text-center">
                    <span className="text-[10px] text-[#c5c9b2] uppercase tracking-wider block">Trust Score</span>
                    <span className="text-lg font-bold text-[#ccf063]">{trustScore}</span>
                    <span className="text-[9px] text-neutral-400 block">Verified Investor</span>
                  </div>
                </div>

                <div className="pt-2 text-[11px] text-[#c5c9b2]/70 leading-relaxed border-t border-white/5">
                  💡 Platform trust metrics are computed automatically based on deal response speeds and verified cap table transactions.
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: Danger Zone */}
          {activeTab === "danger" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-red-500 font-serif italic flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" /> Danger Zone
                </h3>
                <p className="text-xs text-[#c5c9b2] mt-0.5">Irreversible actions regarding your investor profile status.</p>
              </div>

              <div className="p-4 bg-red-950/15 border border-red-500/20 rounded-xl space-y-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white">Deactivate Investor Profile</h4>
                  <p className="text-[10px] text-white/55 leading-relaxed">
                    Temporarily hide your investment thesis and matching cards from founder search queries. You can reactivate this profile at any time.
                  </p>
                </div>
                <button className="px-4 py-2 bg-red-600/10 hover:bg-red-600/20 border border-red-500/30 text-red-400 hover:text-red-300 font-bold rounded-lg text-[10px] transition-all">
                  Deactivate Account
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
