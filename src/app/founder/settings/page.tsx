"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import {
  User,
  Shield,
  Bell,
  Sliders,
  Briefcase,
  AlertTriangle,
  Save,
  Trash2,
  Lock,
  Plus,
  CheckCircle2,
  Video,
  Key,
  Globe,
  Settings,
  ChevronLeft,
  Users,
  UserPlus,
  Crown,
  FileText,
  ChevronDown,
  Sparkles,
  Clock,
  ArrowRight,
  X,
  Building2
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSessionStorage } from "@/hooks/useSessionStorage";

export default function FounderEditProfilePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { role, userName, userEmail } = useAuth();
  
  const isFounder = role === "founder" || !role; // fallback to founder for edit profile route

  // Active Category Tab
  const [activeTab, setActiveTab] = useState<"profile" | "notifications" | "matching" | "deal" | "collaboration" | "danger">("profile");

  // ── Collaboration State ──
  const [ventures, setVentures] = useState<any[]>([]);
  const [selectedVenture, setSelectedVenture] = useState<any>(null);
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [primaryFounderEmail, setPrimaryFounderEmail] = useState<string | null>(null);
  const [primaryFounderName, setPrimaryFounderName] = useState<string | null>(null);
  const [handoffNotes, setHandoffNotes] = useState<any[]>([]);
  const [collabLoading, setCollabLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("VIEWER");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [handoffLoading, setHandoffLoading] = useState(false);
  const [expandedNote, setExpandedNote] = useState<string | null>(null);
  const [ventureDropdownOpen, setVentureDropdownOpen] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [pendingInvitations, setPendingInvitations] = useState<any[]>([]);
  const [invitationsLoading, setInvitationsLoading] = useState(false);

  // Fetch ventures the user has access to
  const fetchVentures = useCallback(async () => {
    if (!userEmail) return;
    try {
      const res = await fetch("/api/startups?founderEmail=" + encodeURIComponent(userEmail));
      const data = (await res.json()) as any;
      if (data.startups && data.startups.length > 0) {
        setVentures(data.startups);
        if (!selectedVenture) setSelectedVenture(data.startups[0]);
      }
    } catch (err) {
      console.error("Failed to fetch ventures:", err);
    }
  }, [userEmail]);

  // Fetch collaborators for selected venture
  const fetchCollaborators = useCallback(async () => {
    if (!selectedVenture || !userEmail) return;
    setCollabLoading(true);
    try {
      const res = await fetch(
        `/api/ventures/collaborators?startupId=${selectedVenture.id}&checkRole=true`,
        { headers: { "x-user-email": userEmail } }
      );
      const data = (await res.json()) as any;
      if (data.success) {
        setCollaborators(data.collaborators || []);
        setPrimaryFounderEmail(data.primaryFounderEmail || null);
        setPrimaryFounderName(data.primaryFounderName || null);
        setCurrentUserRole(data.currentUserRole || null);
      }
    } catch (err) {
      console.error("Failed to fetch collaborators:", err);
    }
    setCollabLoading(false);
  }, [selectedVenture, userEmail]);

  // Fetch handoff notes for selected venture
  const fetchHandoffNotes = useCallback(async () => {
    if (!selectedVenture || !userEmail) return;
    try {
      const res = await fetch(
        `/api/ventures/handoff-notes?startupId=${selectedVenture.id}`,
        { headers: { "x-user-email": userEmail } }
      );
      const data = (await res.json()) as any;
      if (data.success) {
        setHandoffNotes(data.notes || []);
      }
    } catch (err) {
      console.error("Failed to fetch handoff notes:", err);
    }
  }, [selectedVenture, userEmail]);

  // Fetch pending invitations
  const fetchPendingInvitations = useCallback(async () => {
    if (!userEmail) return;
    setInvitationsLoading(true);
    try {
      const res = await fetch("/api/user/invitations", {
        headers: { "x-user-email": userEmail }
      });
      const data = (await res.json()) as any;
      if (data.success) {
        setPendingInvitations(data.invitations || []);
      }
    } catch (err) {
      console.error("Failed to fetch invitations:", err);
    }
    setInvitationsLoading(false);
  }, [userEmail]);

  useEffect(() => {
    if (activeTab === "collaboration") {
      fetchVentures();
      fetchPendingInvitations();
    }
  }, [activeTab, fetchVentures, fetchPendingInvitations]);

  useEffect(() => {
    if (selectedVenture && activeTab === "collaboration") {
      fetchCollaborators();
      fetchHandoffNotes();
    }
  }, [selectedVenture, activeTab, fetchCollaborators, fetchHandoffNotes]);

  // Invite handler
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !selectedVenture) return;
    setInviteLoading(true);
    setInviteError(null);
    setInviteSuccess(null);
    try {
      const res = await fetch("/api/ventures/collaborators", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-email": userEmail || "" },
        body: JSON.stringify({ startupId: selectedVenture.id, email: inviteEmail, role: inviteRole }),
      });
      const data = (await res.json()) as any;
      if (data.success) {
        setInviteEmail("");
        setInviteSuccess(`Invitation sent to ${inviteEmail} as ${inviteRole}`);
        fetchCollaborators();
        setTimeout(() => setInviteSuccess(null), 3000);
      } else {
        setInviteError(data.error || "Failed to invite");
      }
    } catch (err) {
      setInviteError("Network error");
    }
    setInviteLoading(false);
  };

  // Role change handler
  const handleRoleChange = async (collaboratorId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/ventures/collaborators/${collaboratorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-user-email": userEmail || "" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = (await res.json()) as any;
      if (data.success) {
        fetchCollaborators();
      } else {
        alert(data.error || "Failed to change role");
      }
    } catch (err) {
      alert("Network error");
    }
  };

  const handleInviteResponse = async (id: string, status: "ACTIVE" | "REVOKED") => {
    try {
      const res = await fetch(`/api/ventures/collaborators/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-user-email": userEmail || "" },
        body: JSON.stringify({ status })
      });
      const data = (await res.json()) as any;
      if (data.success) {
        fetchPendingInvitations();
        if (status === "ACTIVE") {
          fetchVentures(); // Refresh ventures list since they just accepted
        }
      } else {
        alert(data.error || "Failed to update invitation");
      }
    } catch (err) {
      console.error("Failed to update invitation status", err);
    }
  };

  // Remove collaborator handler
  const handleRemoveCollaborator = async (collaboratorId: string, email: string) => {
    if (!confirm(`Remove ${email} from this venture?`)) return;
    try {
      const res = await fetch(`/api/ventures/collaborators/${collaboratorId}`, {
        method: "DELETE",
        headers: { "x-user-email": userEmail || "" },
      });
      const data = (await res.json()) as any;
      if (data.success) {
        fetchCollaborators();
      } else {
        alert(data.error || "Failed to remove");
      }
    } catch (err) {
      alert("Network error");
    }
  };

  // Generate handoff note handler
  const handleGenerateHandoff = async () => {
    if (!selectedVenture) return;
    setHandoffLoading(true);
    try {
      const res = await fetch("/api/ventures/handoff-notes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-email": userEmail || "" },
        body: JSON.stringify({ startupId: selectedVenture.id }),
      });
      const data = (await res.json()) as any;
      if (data.success) {
        fetchHandoffNotes();
      } else {
        alert(data.error || "Failed to generate handoff note");
      }
    } catch (err) {
      alert("Network error");
    }
    setHandoffLoading(false);
  };

  const roleBadgeColor = (r: string) => {
    switch (r) {
      case "OWNER": return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      case "EDITOR": return "bg-blue-500/15 text-blue-400 border-blue-500/30";
      case "VIEWER": return "bg-white/5 text-white/50 border-white/10";
      default: return "bg-white/5 text-white/50 border-white/10";
    }
  };

  const statusBadgeColor = (s: string) => {
    switch (s) {
      case "ACTIVE": return "bg-emerald-500/15 text-emerald-400";
      case "PENDING": return "bg-yellow-500/15 text-yellow-400";
      case "REVOKED": return "bg-red-500/15 text-red-400";
      default: return "bg-white/5 text-white/50";
    }
  };

  // Tab 1: Profile & Account State
  const [profileData, setProfileData, clearProfileData] = useSessionStorage("founder-profile-data", {
    name: userName || "Swapn Kumar",
    email: userEmail || "swapn@gmail.com",
    roleTitle: isFounder ? "CEO & Technical Co-founder" : "Managing Partner",
    companyName: isFounder ? "NeuralNexus AI" : "Apex Horizon Ventures",
    location: "San Francisco, CA",
    tagline: isFounder ? "Building the next generation of modular EV charging infrastructure." : "Accelerating Seed to Series A deeptech and infrastructure.",
    timezone: "UTC-8 (Pacific Time)",
    publicUrl: isFounder ? "ventureiq.com/startup/neuralnexus" : "ventureiq.com/investor/apexhorizon",
  });

  // Tab 2: Security State
  const [twoFactor, setTwoFactor] = useState(false);
  const [activeSessions] = useState([
    { device: "MacBook Pro - Chrome", ip: "192.168.1.45", active: "Current session" },
    { device: "iPhone 15 Pro Max - App", ip: "172.56.21.9", active: "Active 2 hours ago" },
  ]);

  // Tab 3: Granular Notifications Matrix State
  const [notifications, setNotifications, clearNotifications] = useSessionStorage("founder-profile-notifications", {
    matches: { email: true, push: true, inApp: true },
    outreach: { email: true, push: false, inApp: true },
    messages: { email: true, push: true, inApp: true },
    stages: { email: false, push: true, inApp: true },
    milestones: { email: false, push: false, inApp: true },
    digest: "daily",
  });

  // Tab 4: Matching Preferences (Feeds the algorithm)
  const [matchingPreferences, setMatchingPreferences, clearMatchingPreferences] = useSessionStorage("founder-profile-matching", {
    // Founder Side
    investorTypes: ["Angel", "Micro-VC", "Syndicate"],
    minCheckSize: "$50,000",
    style: "active", // active vs passive
    priority: "GTM Help & Recruiting",
    geoPref: "Global",
    // Investor Side
    sectors: ["DeepTech", "SaaS", "Energy Infrastructure"],
    stages: ["Pre-Seed", "Seed"],
    checkMin: "$100,000",
    checkMax: "$1,000,000",
    instrument: "SAFE",
    minTraction: "Post-Revenue",
  });

  // Tab 5: Deal / Fundraising Settings
  const [dealSettings, setDealSettings, clearDealSettings] = useSessionStorage("founder-profile-deal", {
    // Founder Side
    roundAmount: "$2,500,000",
    roundInstrument: "SAFE (Uncapped)",
    roundCap: "$15,000,000",
    targetClose: "2026-12-31",
    minTicketSize: "$25,000",
    autoAcceptRequests: false,
    showCommittedAmount: true,
    // Investor Side
    defaultCheckSize: "$250,000",
    autoDeclineOutsideThesis: true,
    spvPreference: "Pooled SPV",
  });

  // Save changes notification
  const [showSaveToast, setShowSaveToast] = useState(false);

  const handleSave = () => {
    // In a real app, make API call here
    clearProfileData();
    clearNotifications();
    clearMatchingPreferences();
    clearDealSettings();
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 3000);
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".animate-item",
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: "power2.out" }
      );
    }, containerRef);
    return () => ctx.revert();
  }, [activeTab]);

  return (
    <div ref={containerRef} className="space-y-6 max-w-7xl mx-auto font-sans px-4 sm:px-8 py-8 pb-12">
      
      {/* Toast Notification */}
      {showSaveToast && (
        <div className="fixed top-6 right-6 z-50 bg-[#ccf063] text-black px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 font-bold text-xs animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-black" />
          <span>Settings saved successfully!</span>
        </div>
      )}

      {/* Header Bar: Back Button + Title */}
      <header className="flex justify-between items-center border-b border-white/5 pb-4 gap-4">
        <div className="flex items-center gap-3 animate-item">
          <button
            onClick={() => router.push(isFounder ? "/founder/fundraising" : "/investor/feed")}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-all flex items-center justify-center"
            title="Back to Workspace"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h1 className="text-xl font-bold text-white tracking-tight">Settings</h1>
        </div>
        <div className="animate-item flex gap-3 text-xs font-bold shrink-0">
          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-lg bg-[#ccf063] text-black hover:shadow-[0_0_24px_rgba(212,249,106,0.3)] transition-all flex items-center justify-center gap-1.5"
          >
            <Save className="w-4 h-4" /> Save Changes
          </button>
        </div>
      </header>

      {/* Settings Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Hand Navigation Menu */}
        <div className="lg:col-span-3 space-y-2 animate-item">
          {(
            [
              { id: "profile", label: "Account Details", icon: User },
              { id: "notifications", label: "Notifications", icon: Bell },
              { id: "matching", label: "Matching Prefs", icon: Sliders },
              { id: "deal", label: isFounder ? "Fundraising Rules" : "Deal Rules", icon: Briefcase },
              { id: "collaboration", label: "Collaboration", icon: Users },
              { id: "danger", label: "Danger Zone", icon: AlertTriangle },
            ] as const
          ).map((tab) => {
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

        {/* Right Content Column */}
        <div className="lg:col-span-9 bg-[#1f1f1f] border border-white/10 rounded-2xl p-6 lg:p-8 space-y-8 min-h-[480px]">
          
          {/* TAB 1: Account Details */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white font-serif italic">Account Details</h3>
                <p className="text-xs text-[#c5c9b2] mt-0.5">Manage your primary login credentials and account settings.</p>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="text-[#c5c9b2] text-sm uppercase font-bold tracking-wider">Full Name</label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    className="w-full"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[#c5c9b2] text-sm uppercase font-bold tracking-wider">Primary Email</label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    className="w-full"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[#c5c9b2] text-sm uppercase font-bold tracking-wider">Location</label>
                  <input
                    type="text"
                    value={profileData.location}
                    onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                    className="w-full"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[#c5c9b2] text-sm uppercase font-bold tracking-wider">Time Zone</label>
                  <select
                    value={profileData.timezone}
                    onChange={(e) => setProfileData({ ...profileData, timezone: e.target.value })}
                    className="w-full"
                  >
                    <option value="UTC-8 (Pacific Time)">UTC-8 (Pacific Time)</option>
                    <option value="UTC-5 (Eastern Time)">UTC-5 (Eastern Time)</option>
                    <option value="UTC+0 (London)">UTC+0 (London)</option>
                    <option value="UTC+5:30 (India)">UTC+5:30 (India)</option>
                  </select>
                </div>
              </div>
            </div>
          )}



          {/* TAB 3: Granular Notifications Matrix */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white font-serif italic">Notification Matrix</h3>
                <p className="text-xs text-[#c5c9b2] mt-0.5">
                  Granularly configure how you receive matches, messages, and stages alerts per channel.
                </p>
              </div>

              {/* Custom Toggles Table Matrix */}
              <div className="border border-white/10 rounded-xl overflow-hidden bg-black/15">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-black/35 border-b border-white/10 text-sm uppercase tracking-wider text-[#c5c9b2] font-bold">
                      <th className="p-4">Notification Event</th>
                      <th className="p-4 text-center">Email</th>
                      <th className="p-4 text-center">Mobile Push</th>
                      <th className="p-4 text-center">In-App Alerts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-white/80">
                    {(
                      [
                        { id: "matches", label: isFounder ? "New match/interest request received" : "New startup matching thesis" },
                        { id: "outreach", label: "Outreach query accepted or declined" },
                        { id: "messages", label: "New secure E2EE chat message" },
                        { id: "stages", label: "Negotiation stage / term sheet updates" },
                        { id: "milestones", label: "Round target or syndicate commitments milestones" },
                      ] as const
                    ).map((row) => (
                      <tr key={row.id} className="hover:bg-white/[0.01]">
                        <td className="p-4 font-semibold text-white text-[11px] leading-relaxed max-w-[200px] sm:max-w-xs">{row.label}</td>
                        <td className="p-4 text-center">
                          <input
                            type="checkbox"
                            checked={notifications[row.id].email}
                            onChange={(e) =>
                              setNotifications({
                               ...notifications,
                                [row.id]: { ...notifications[row.id], email: e.target.checked },
                              })
                            }
                            className="w-4 h-4 rounded border-white/20 text-[#ccf063] focus:ring-0 focus:ring-offset-0 bg-transparent"
                          />
                        </td>
                        <td className="p-4 text-center">
                          <input
                            type="checkbox"
                            checked={notifications[row.id].push}
                            onChange={(e) =>
                              setNotifications({
                               ...notifications,
                                [row.id]: { ...notifications[row.id], push: e.target.checked },
                              })
                            }
                            className="w-4 h-4 rounded border-white/20 text-[#ccf063] focus:ring-0 focus:ring-offset-0 bg-transparent"
                          />
                        </td>
                        <td className="p-4 text-center">
                          <input
                            type="checkbox"
                            checked={notifications[row.id].inApp}
                            onChange={(e) =>
                              setNotifications({
                               ...notifications,
                                [row.id]: { ...notifications[row.id], inApp: e.target.checked },
                              })
                            }
                            className="w-4 h-4 rounded border-white/20 text-[#ccf063] focus:ring-0 focus:ring-offset-0 bg-transparent"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Digest frequency config */}
              <div className="space-y-2 text-xs">
                <label className="text-[#c5c9b2] text-sm uppercase font-bold tracking-wider">Milestone Digest Frequency</label>
                <div className="flex gap-2">
                  {["daily", "weekly", "off"].map((freq) => (
                    <button
                      key={freq}
                      onClick={() => setNotifications({ ...notifications, digest: freq })}
                      className={`flex-1 py-2 text-center rounded-xl font-bold uppercase tracking-wider text-sm transition-all border ${
                        notifications.digest === freq
                          ? "bg-[#ccf063] text-black border-[#ccf063]"
                          : "bg-transparent text-white/60 border-white/10 hover:text-white"
                      }`}
                    >
                      {freq}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Matching Preferences (Role-specific feeds for algorithm) */}
          {activeTab === "matching" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white font-serif italic">Matchmaker Preferences</h3>
                <p className="text-xs text-[#c5c9b2] mt-0.5">
                  These settings calibrate the auto-matchmaking algorithm that highlights startups and investors.
                </p>
              </div>

              {isFounder ? (
                /* Founder Matching preferences */
                <div className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <label className="text-[#c5c9b2] text-sm uppercase font-bold tracking-wider">Preferred Investor Types</label>
                    <div className="grid grid-cols-3 gap-2">
                      {["Angel", "Micro-VC", "Syndicate", "Corporate", "Institutional"].map((type) => {
                        const isSelected = matchingPreferences.investorTypes.includes(type);
                        return (
                          <button
                            key={type}
                            onClick={() => {
                              const next = isSelected
                                ? matchingPreferences.investorTypes.filter((t) => t !== type)
                                : [...matchingPreferences.investorTypes, type];
                              setMatchingPreferences({ ...matchingPreferences, investorTypes: next });
                            }}
                            className={`py-2 px-3 border rounded-xl font-bold text-sm transition-all text-center ${
                              isSelected
                                ? "bg-[#ccf063]/10 border-[#ccf063] text-[#ccf063]"
                                : "bg-transparent border-white/10 text-white/60 hover:text-white"
                            }`}
                          >
                            {type}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[#c5c9b2] text-sm uppercase font-bold tracking-wider">Minimum Check Size Threshold</label>
                      <select
                        value={matchingPreferences.minCheckSize}
                        onChange={(e) => setMatchingPreferences({ ...matchingPreferences, minCheckSize: e.target.value })}
                        className="w-full"
                      >
                        <option value="$10,000">$10,000</option>
                        <option value="$25,000">$25,000</option>
                        <option value="$50,000">$50,000</option>
                        <option value="$100,000">$100,000</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[#c5c9b2] text-sm uppercase font-bold tracking-wider">Geographic Preference</label>
                      <select
                        value={matchingPreferences.geoPref}
                        onChange={(e) => setMatchingPreferences({ ...matchingPreferences, geoPref: e.target.value })}
                        className="w-full"
                      >
                        <option value="Local-only">Local-only</option>
                        <option value="Regional">Regional</option>
                        <option value="Global">Global</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[#c5c9b2] text-sm uppercase font-bold tracking-wider">Value-Add Priority</label>
                      <select
                        value={matchingPreferences.priority}
                        onChange={(e) => setMatchingPreferences({ ...matchingPreferences, priority: e.target.value })}
                        className="w-full"
                      >
                        <option value="Capital only">Capital only</option>
                        <option value="GTM Help & Recruiting">GTM Help & Recruiting</option>
                        <option value="Board seat & Advisory">Board seat & Advisory</option>
                        <option value="Technical Mentorship">Technical Mentorship</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[#c5c9b2] text-sm uppercase font-bold tracking-wider">Preferred Style</label>
                      <div className="flex gap-2">
                        {["active", "passive"].map((styleOpt) => (
                          <button
                            key={styleOpt}
                            onClick={() => setMatchingPreferences({ ...matchingPreferences, style: styleOpt })}
                            className={`flex-1 py-2 rounded-xl border font-bold uppercase tracking-wider text-sm transition-all ${
                              matchingPreferences.style === styleOpt
                                ? "bg-[#ccf063]/10 border-[#ccf063] text-[#ccf063]"
                                : "bg-transparent border-white/10 text-white/60 hover:text-white"
                            }`}
                          >
                            {styleOpt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Investor Matching preferences */
                <div className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <label className="text-[#c5c9b2] text-sm uppercase font-bold tracking-wider">Investment Sectors</label>
                    <div className="grid grid-cols-3 gap-2">
                      {["DeepTech", "SaaS", "Energy Infrastructure", "FinTech", "BioTech", "AI/ML"].map((sec) => {
                        const isSelected = matchingPreferences.sectors.includes(sec);
                        return (
                          <button
                            key={sec}
                            onClick={() => {
                              const next = isSelected
                                ? matchingPreferences.sectors.filter((s) => s !== sec)
                                : [...matchingPreferences.sectors, sec];
                              setMatchingPreferences({ ...matchingPreferences, sectors: next });
                            }}
                            className={`py-2 px-3 border rounded-xl font-bold text-sm transition-all text-center ${
                              isSelected
                                ? "bg-[#ccf063]/10 border-[#ccf063] text-[#ccf063]"
                                : "bg-transparent border-white/10 text-white/60 hover:text-white"
                            }`}
                          >
                            {sec}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[#c5c9b2] text-sm uppercase font-bold tracking-wider">Target Stage Range</label>
                      <div className="flex gap-2">
                        {["Pre-Seed", "Seed", "Series A"].map((st) => {
                          const isSelected = matchingPreferences.stages.includes(st);
                          return (
                            <button
                              key={st}
                              onClick={() => {
                                const next = isSelected
                                  ? matchingPreferences.stages.filter((s) => s !== st)
                                  : [...matchingPreferences.stages, st];
                                setMatchingPreferences({ ...matchingPreferences, stages: next });
                              }}
                              className={`flex-1 py-2 border rounded-xl font-bold text-sm transition-all ${
                                isSelected
                                  ? "bg-[#ccf063]/10 border-[#ccf063] text-[#ccf063]"
                                  : "bg-transparent border-white/10 text-white/60 hover:text-white"
                              }`}
                            >
                              {st}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[#c5c9b2] text-sm uppercase font-bold tracking-wider">Minimum Traction Filter</label>
                      <select
                        value={matchingPreferences.minTraction}
                        onChange={(e) => setMatchingPreferences({ ...matchingPreferences, minTraction: e.target.value })}
                        className="w-full"
                      >
                        <option value="Pre-revenue">Any Traction</option>
                        <option value="Post-Revenue">Post-Revenue</option>
                        <option value="Growth (+$1M ARR)">Growth (+$1M ARR)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[#c5c9b2] text-sm uppercase font-bold tracking-wider">Min Check Size</label>
                      <input
                        type="text"
                        value={matchingPreferences.checkMin}
                        onChange={(e) => setMatchingPreferences({ ...matchingPreferences, checkMin: e.target.value })}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[#c5c9b2] text-sm uppercase font-bold tracking-wider">Max Check Size</label>
                      <input
                        type="text"
                        value={matchingPreferences.checkMax}
                        onChange={(e) => setMatchingPreferences({ ...matchingPreferences, checkMax: e.target.value })}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: Deal / Fundraising Settings */}
          {activeTab === "deal" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white font-serif italic">
                  {isFounder ? "Fundraising & Capital Settings" : "Deal Operations Settings"}
                </h3>
                <p className="text-xs text-[#c5c9b2] mt-0.5">
                  {isFounder ? "Configure details for active campaign round parameters." : "Configure default ticket and check parameters for syndicates."}
                </p>
              </div>

              {isFounder ? (
                /* Founder Fundraising rules */
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[#c5c9b2] text-sm uppercase font-bold tracking-wider">Active Round Ask Amount</label>
                      <input
                        type="text"
                        value={dealSettings.roundAmount}
                        onChange={(e) => setDealSettings({ ...dealSettings, roundAmount: e.target.value })}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[#c5c9b2] text-sm uppercase font-bold tracking-wider">Valuation Cap</label>
                      <input
                        type="text"
                        value={dealSettings.roundCap}
                        onChange={(e) => setDealSettings({ ...dealSettings, roundCap: e.target.value })}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[#c5c9b2] text-sm uppercase font-bold tracking-wider">Investment Instrument</label>
                      <select
                        value={dealSettings.roundInstrument}
                        onChange={(e) => setDealSettings({ ...dealSettings, roundInstrument: e.target.value })}
                        className="w-full"
                      >
                        <option value="SAFE (Uncapped)">SAFE (Uncapped)</option>
                        <option value="SAFE (Capped)">SAFE (Capped)</option>
                        <option value="Priced Equity Round">Priced Equity Round</option>
                        <option value="Convertible Note">Convertible Note</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[#c5c9b2] text-sm uppercase font-bold tracking-wider">Target Close Date</label>
                      <input
                        type="date"
                        value={dealSettings.targetClose}
                        onChange={(e) => setDealSettings({ ...dealSettings, targetClose: e.target.value })}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Toggle: Round visibility */}
                  <div className="flex items-center justify-between p-4 bg-black/20 border border-white/5 rounded-xl">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-white">Publicize Round Milestones</h4>
                      <p className="text-sm text-white/50">Show progress percentages on search cards (e.g. "80% committed").</p>
                    </div>
                    <button
                      onClick={() => setDealSettings({ ...dealSettings, showCommittedAmount: !dealSettings.showCommittedAmount })}
                      className={`w-10 h-5.5 rounded-full p-0.5 transition-colors ${dealSettings.showCommittedAmount ? "bg-[#ccf063]" : "bg-white/10"}`}
                    >
                      <div className={`w-4.5 h-4.5 rounded-full bg-black transition-transform ${dealSettings.showCommittedAmount ? "translate-x-4.5" : "translate-x-0"}`} />
                    </button>
                  </div>
                </div>
              ) : (
                /* Investor Deal rules */
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[#c5c9b2] text-sm uppercase font-bold tracking-wider">Default Auto-fill Check Size</label>
                      <input
                        type="text"
                        value={dealSettings.defaultCheckSize}
                        onChange={(e) => setDealSettings({ ...dealSettings, defaultCheckSize: e.target.value })}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[#c5c9b2] text-sm uppercase font-bold tracking-wider">Investment Vehicle Preference</label>
                      <select
                        value={dealSettings.spvPreference}
                        onChange={(e) => setDealSettings({ ...dealSettings, spvPreference: e.target.value })}
                        className="w-full"
                      >
                        <option value="Pooled SPV">Pooled SPV (Syndicated)</option>
                        <option value="Direct Line">Direct Cap Table Placement</option>
                      </select>
                    </div>
                  </div>

                  {/* Toggle: auto-decline */}
                  <div className="flex items-center justify-between p-4 bg-black/20 border border-white/5 rounded-xl">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-white">Auto-Pass Outside Thesis</h4>
                      <p className="text-sm text-white/50">Auto-skip incoming pitches that do not match check limits or sector filters.</p>
                    </div>
                    <button
                      onClick={() => setDealSettings({ ...dealSettings, autoDeclineOutsideThesis: !dealSettings.autoDeclineOutsideThesis })}
                      className={`w-10 h-5.5 rounded-full p-0.5 transition-colors ${dealSettings.autoDeclineOutsideThesis ? "bg-[#ccf063]" : "bg-white/10"}`}
                    >
                      <div className={`w-4.5 h-4.5 rounded-full bg-black transition-transform ${dealSettings.autoDeclineOutsideThesis ? "translate-x-4.5" : "translate-x-0"}`} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: Danger Zone */}
          {activeTab === "danger" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-red-500 font-serif italic flex items-center gap-1.5">
                  <AlertTriangle className="w-5 h-5 text-red-500" /> Danger Zone Settings
                </h3>
                <p className="text-xs text-white/60 mt-0.5">Irreversible administrative actions related to account, data, and campaigns.</p>
              </div>

              <div className="divide-y divide-red-500/10 border border-red-500/20 bg-red-950/10 rounded-xl overflow-hidden text-xs">
                
                {/* Deactivate account */}
                <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h4 className="font-bold text-white">Deactivate Public Workspace Profile</h4>
                    <p className="text-sm text-white/50 leading-relaxed mt-0.5">
                      Temporarily hide your metrics and card from feeds. You can reactivate anytime.
                    </p>
                  </div>
                  <button className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-white font-bold rounded-lg border border-white/10 text-sm shrink-0">
                    Deactivate Profile
                  </button>
                </div>

                {/* Close campaign */}
                {isFounder && (
                  <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h4 className="font-bold text-white">Close Active Campaign Round</h4>
                      <p className="text-sm text-white/50 leading-relaxed mt-0.5">
                        Close the fundraising round. Archives all current negotiation channels.
                      </p>
                    </div>
                    <button className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-white font-bold rounded-lg border border-white/10 text-sm shrink-0">
                      Close Campaign
                    </button>
                  </div>
                )}

                {/* Permanent Delete */}
                <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h4 className="font-bold text-red-400">Permanently Delete Account</h4>
                    <p className="text-sm text-white/50 leading-relaxed mt-0.5">
                      Fully delete your personal identity, messages, and associated venture entities. This is irreversible.
                    </p>
                  </div>
                  <button className="px-4 py-2 bg-red-500/10 border border-red-500/30 hover:bg-red-500 hover:text-black text-red-400 font-bold rounded-lg text-sm flex items-center gap-1.5 shrink-0 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" /> Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Collaboration */}
          {activeTab === "collaboration" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white font-serif italic flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#ccf063]" /> Venture Collaboration
                </h3>
                <p className="text-xs text-[#c5c9b2] mt-0.5">
                  Manage team members and roles for each of your ventures. Like GCP IAM — per-venture access control.
                </p>
              </div>

              {/* Pending Invitations */}
              {pendingInvitations.length > 0 && (
                <div className="bg-amber-900/20 border border-amber-500/30 rounded-xl p-4 space-y-3">
                  <h4 className="text-sm font-bold text-amber-500 flex items-center gap-2">
                    <Bell className="w-4 h-4" /> Pending Invitations ({pendingInvitations.length})
                  </h4>
                  <div className="space-y-2">
                    {pendingInvitations.map((inv) => (
                      <div key={inv.id} className="bg-black/40 border border-amber-500/20 rounded-lg p-3 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-white">{inv.startup.name}</div>
                          <div className="text-xs text-white/50">Invited as <span className="text-[#ccf063] uppercase">{inv.role}</span> by {inv.startup.founderProfile?.fullName || 'Owner'}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleInviteResponse(inv.id, "ACTIVE")}
                            className="px-3 py-1.5 bg-[#ccf063] hover:bg-[#b0d449] text-black font-bold text-xs rounded-lg transition-colors"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleInviteResponse(inv.id, "REVOKED")}
                            className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold text-xs rounded-lg transition-colors"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Venture Selector */}
              <div className="relative">
                <label className="text-[#c5c9b2] text-sm uppercase font-bold tracking-wider block mb-2">Select Venture</label>
                <button
                  onClick={() => setVentureDropdownOpen(!ventureDropdownOpen)}
                  className="w-full flex items-center justify-between bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white hover:border-[#ccf063]/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ccf063]/20 to-[#ccf063]/5 border border-[#ccf063]/20 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-[#ccf063]" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold">{selectedVenture?.name || "Select a venture"}</div>
                      {selectedVenture?.stage && (
                        <div className="text-xs text-white/40 mt-0.5">{selectedVenture.stage} • {selectedVenture.category}</div>
                      )}
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${ventureDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {ventureDropdownOpen && ventures.length > 0 && (
                  <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                    {ventures.map((v: any) => (
                      <button
                        key={v.id}
                        onClick={() => { setSelectedVenture(v); setVentureDropdownOpen(false); }}
                        className={`w-full text-left px-4 py-3 text-sm hover:bg-white/5 transition-colors flex items-center gap-3 ${
                          selectedVenture?.id === v.id ? 'bg-[#ccf063]/5 text-[#ccf063]' : 'text-white/70'
                        }`}
                      >
                        <Building2 className="w-4 h-4 text-white/30" />
                        <span className="font-semibold">{v.name}</span>
                        <span className="text-xs text-white/30 ml-auto">{v.stage}</span>
                      </button>
                    ))}
                  </div>
                )}
                {ventures.length === 0 && (
                  <p className="text-xs text-white/30 mt-2">No ventures found. Create a startup first.</p>
                )}
              </div>

              {/* Collaborators Section */}
              {selectedVenture && (
                <>
                  {/* Primary Founder (Protected) */}
                  <div>
                    <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-amber-400" /> Team Members
                    </h4>
                    
                    {/* Primary Founder Row */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between bg-amber-500/[0.04] border border-amber-500/10 p-4 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/30 to-amber-600/10 flex items-center justify-center border border-amber-500/20">
                            <Crown className="w-4 h-4 text-amber-400" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white flex items-center gap-2">
                              {primaryFounderName || primaryFounderEmail || userEmail}
                              {primaryFounderEmail === userEmail && <span className="text-[10px] bg-white/10 text-white/50 px-1.5 py-0.5 rounded-full">(You)</span>}
                            </div>
                            <div className="text-xs text-white/40 mt-0.5">{primaryFounderEmail || userEmail}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${roleBadgeColor('OWNER')}`}>
                            Primary Owner
                          </span>
                          <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-1 rounded-full font-semibold">Protected</span>
                        </div>
                      </div>

                      {/* Collaborator Rows */}
                      {collabLoading ? (
                        <div className="text-center py-8 text-white/30 text-xs">Loading collaborators...</div>
                      ) : (
                        collaborators.map((c: any) => (
                          <div key={c.id} className="flex items-center justify-between bg-black/20 border border-white/5 p-4 rounded-xl hover:border-white/10 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center border border-white/10">
                                <span className="text-white/70 font-bold text-sm">{c.userEmail[0].toUpperCase()}</span>
                              </div>
                              <div>
                                <div className="text-sm font-bold text-white flex items-center gap-2">
                                  {c.userEmail}
                                  {c.userEmail === userEmail && <span className="text-[10px] bg-white/10 text-white/50 px-1.5 py-0.5 rounded-full">(You)</span>}
                                </div>
                                <div className="text-xs text-white/30 mt-0.5">Added by {c.invitedBy} • {new Date(c.createdAt).toLocaleDateString()}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${statusBadgeColor(c.status)}`}>
                                {c.status}
                              </span>
                              {currentUserRole === "OWNER" ? (
                                <select
                                  value={c.role}
                                  onChange={(e) => handleRoleChange(c.id, e.target.value)}
                                  className="bg-black/50 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-[#ccf063]/50"
                                >
                                  <option value="OWNER">Owner</option>
                                  <option value="EDITOR">Editor</option>
                                  <option value="VIEWER">Viewer</option>
                                </select>
                              ) : (
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${roleBadgeColor(c.role)}`}>
                                  {c.role}
                                </span>
                              )}
                              {currentUserRole === "OWNER" && (
                                <button
                                  onClick={() => handleRemoveCollaborator(c.id, c.userEmail)}
                                  className="p-1.5 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                  title="Remove collaborator"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}

                      {collaborators.length === 0 && !collabLoading && (
                        <div className="text-center py-6 text-white/20 text-xs border border-dashed border-white/5 rounded-xl">
                          No collaborators yet. Invite team members below.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Invite Form (Owner only) */}
                  {currentUserRole === "OWNER" && (
                    <div className="border border-white/10 rounded-xl p-5 bg-black/10">
                      <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                        <UserPlus className="w-4 h-4 text-[#ccf063]" /> Invite Collaborator
                      </h4>
                      <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
                        <input
                          type="email"
                          placeholder="colleague@email.com"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white text-xs focus:outline-none focus:border-[#ccf063]/50 placeholder:text-white/20"
                          required
                        />
                        <select
                          value={inviteRole}
                          onChange={(e) => setInviteRole(e.target.value)}
                          className="bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-white text-xs focus:outline-none focus:border-[#ccf063]/50"
                        >
                          <option value="VIEWER">Viewer (Read Only)</option>
                          <option value="EDITOR">Editor (Can Edit)</option>
                          <option value="OWNER">Owner (Full Access)</option>
                        </select>
                        <button
                          type="submit"
                          disabled={inviteLoading}
                          className="bg-[#ccf063] hover:bg-[#bce650] text-black font-bold px-5 py-2.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 whitespace-nowrap"
                        >
                          {inviteLoading ? "Sending..." : <><ArrowRight className="w-3.5 h-3.5" /> Send Invite</>}
                        </button>
                      </form>
                      {inviteError && <p className="text-xs text-red-400 mt-2">{inviteError}</p>}
                      {inviteSuccess && <p className="text-xs text-emerald-400 mt-2">✓ {inviteSuccess}</p>}
                      <p className="text-[10px] text-white/20 mt-2">Only existing Venture IQ users can be invited.</p>
                    </div>
                  )}

                  {/* Role Permission Reference */}
                  <div className="border border-white/5 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedNote(expandedNote === 'permissions' ? null : 'permissions')}
                      className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-white/50 hover:text-white/70 transition-colors"
                    >
                      <span className="flex items-center gap-2"><Shield className="w-3.5 h-3.5" /> Permission Matrix Reference</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedNote === 'permissions' ? 'rotate-180' : ''}`} />
                    </button>
                    {expandedNote === 'permissions' && (
                      <div className="px-4 pb-4">
                        <table className="w-full text-[10px] border-collapse">
                          <thead>
                            <tr className="text-[#c5c9b2] uppercase tracking-wider border-b border-white/5">
                              <th className="text-left py-2 pr-2">Feature</th>
                              <th className="text-center py-2 px-2">Owner</th>
                              <th className="text-center py-2 px-2">Editor</th>
                              <th className="text-center py-2 px-2">Viewer</th>
                            </tr>
                          </thead>
                          <tbody className="text-white/60">
                            {[
                              ["Venture Profile", "Edit", "Edit", "View"],
                              ["Validation / Grill", "Full", "View", "View"],
                              ["Fundraising", "Full", "View", "View"],
                              ["Meetings", "Full", "Join", "View"],
                              ["Projects", "Full", "Edit", "View"],
                              ["Pitch Setup", "Full", "Edit", "View"],
                              ["Chat / DMs", "Full", "—", "—"],
                              ["Team Mgmt", "Full", "—", "—"],
                              ["Danger Zone", "Full", "—", "—"],
                              ["Handoff Notes", "Create", "Create", "View"],
                            ].map(([feat, o, e, v], idx) => (
                              <tr key={idx} className="border-b border-white/[0.02]">
                                <td className="py-1.5 pr-2 font-semibold text-white/70">{feat}</td>
                                <td className="py-1.5 px-2 text-center text-amber-400">{o}</td>
                                <td className="py-1.5 px-2 text-center text-blue-400">{e}</td>
                                <td className="py-1.5 px-2 text-center text-white/30">{v}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Handoff Notes Section */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#ccf063]" /> Handoff Notes
                      </h4>
                      {(currentUserRole === "OWNER" || currentUserRole === "EDITOR") && (
                        <button
                          onClick={handleGenerateHandoff}
                          disabled={handoffLoading}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#ccf063]/10 text-[#ccf063] border border-[#ccf063]/20 hover:bg-[#ccf063]/20 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Sparkles className="w-3.5 h-3.5" /> {handoffLoading ? "Generating..." : "Generate Handoff"}
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      {handoffNotes.length === 0 ? (
                        <div className="text-center py-8 text-white/20 text-xs border border-dashed border-white/5 rounded-xl">
                          No handoff notes yet. Generate one to create a context summary for your team.
                        </div>
                      ) : (
                        handoffNotes.map((note: any) => (
                          <div key={note.id} className="border border-white/5 rounded-xl overflow-hidden bg-black/10">
                            <button
                              onClick={() => setExpandedNote(expandedNote === note.id ? null : note.id)}
                              className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
                            >
                              <div className="text-left">
                                <div className="text-xs font-bold text-white">{note.title}</div>
                                <div className="text-[10px] text-white/30 mt-0.5 flex items-center gap-2">
                                  <Clock className="w-3 h-3" /> {new Date(note.createdAt).toLocaleDateString()}
                                  {note.assignedTo && <span>→ {note.assignedTo}</span>}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                                  note.status === 'OPEN' ? 'bg-yellow-500/15 text-yellow-400' :
                                  note.status === 'ACKNOWLEDGED' ? 'bg-blue-500/15 text-blue-400' :
                                  'bg-emerald-500/15 text-emerald-400'
                                }`}>{note.status}</span>
                                <ChevronDown className={`w-3.5 h-3.5 text-white/30 transition-transform ${expandedNote === note.id ? 'rotate-180' : ''}`} />
                              </div>
                            </button>
                            {expandedNote === note.id && (
                              <div className="px-4 pb-4 space-y-3 border-t border-white/5">
                                <div className="pt-3">
                                  <div className="text-[10px] text-[#c5c9b2] uppercase font-bold tracking-wider mb-1">Current State</div>
                                  <pre className="text-xs text-white/60 whitespace-pre-wrap font-sans leading-relaxed bg-black/20 rounded-lg p-3 border border-white/5">{note.context}</pre>
                                </div>
                                {note.pendingActions && (
                                  <div>
                                    <div className="text-[10px] text-[#c5c9b2] uppercase font-bold tracking-wider mb-1">⏳ Pending Actions</div>
                                    <pre className="text-xs text-white/60 whitespace-pre-wrap font-sans leading-relaxed bg-black/20 rounded-lg p-3 border border-white/5">{note.pendingActions}</pre>
                                  </div>
                                )}
                                {note.keyDecisions && (
                                  <div>
                                    <div className="text-[10px] text-[#c5c9b2] uppercase font-bold tracking-wider mb-1">🔑 Key Decisions</div>
                                    <pre className="text-xs text-white/60 whitespace-pre-wrap font-sans leading-relaxed bg-black/20 rounded-lg p-3 border border-white/5">{note.keyDecisions}</pre>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
