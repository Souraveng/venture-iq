"use client";
import ProjectGuard from "@/components/ProjectGuard";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signOut } from "next-auth/react";

const members = [
  { name: "Sarah Chen",    email: "sarah@studio.ai",  avatar: "SC", role: "Owner",     lastActive: "Just now",  color: "#818cf8" },
  { name: "Marcus Lee",    email: "marcus@studio.ai", avatar: "ML", role: "Admin",     lastActive: "2h ago",    color: "#34d399" },
  { name: "Priya Patel",   email: "priya@studio.ai",  avatar: "PP", role: "Developer", lastActive: "4h ago",    color: "#f472b6" },
  { name: "Diego Alvarez", email: "diego@studio.ai",  avatar: "DV", role: "Viewer",    lastActive: "Yesterday", color: "#fbbf24" },
  { name: "Aisha Mohamed", email: "aisha@studio.ai",  avatar: "AM", role: "Developer", lastActive: "2 days ago",color: "#2dd4bf" },
];

const roleStyle: Record<string, { bg: string; text: string }> = {
  Owner:     { bg: "rgba(99,102,241,0.12)", text: "#818cf8"  },
  Admin:     { bg: "rgba(16,185,129,0.12)", text: "#34d399"  },
  Developer: { bg: "rgba(245,158,11,0.12)", text: "#fbbf24"  },
  Viewer:    { bg: "rgba(74,74,106,0.2)",   text: "#8888aa"  },
};

const tabs = ["Profile", "Team", "General", "Billing", "API Keys", "Integrations"];

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const [activeTab, setActiveTab] = useState("Profile");
  
  // Profile settings state
  const [profileName, setProfileName] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileUpdating, setProfileUpdating] = useState(false);
  const [profileUpdateStatus, setProfileUpdateStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const [inviteEmail, setInviteEmail] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [geminiKey, setGeminiKey] = useState("");
  const [cloudflareToken, setCloudflareToken] = useState("");
  const [cloudflareAccount, setCloudflareAccount] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // Load profile data
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/user");
        if (res.ok) {
          const data = await res.json();
          setProfileName(data.name || "");
          setProfileImage(data.image || "");
          setProfileEmail(data.email || "");
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setProfileLoading(false);
      }
    }
    loadProfile();
  }, []);

  async function handleSaveProfile() {
    setProfileUpdating(true);
    setProfileUpdateStatus("saving");
    try {
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profileName, image: profileImage }),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      
      // Update local NextAuth session if active
      if (updateSession) {
        await updateSession({ name: profileName, image: profileImage });
      }
      
      setProfileUpdateStatus("saved");
      setTimeout(() => setProfileUpdateStatus("idle"), 2000);
    } catch (err) {
      console.error(err);
      setProfileUpdateStatus("error");
      setTimeout(() => setProfileUpdateStatus("idle"), 2000);
    } finally {
      setProfileUpdating(false);
    }
  }

  async function handleDeleteAccount() {
    try {
      const res = await fetch("/api/user", {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete account");
      
      // Clear localStorage project selection and sign out
      localStorage.removeItem("startupos-projects-meta");
      await signOut({ callbackUrl: "/" });
    } catch (err) {
      console.error("Error deleting account:", err);
      alert("Failed to delete account. Please try again.");
    }
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      setGeminiKey(localStorage.getItem("gemini_api_key") || "");
      setCloudflareToken(localStorage.getItem("cloudflare_api_token") || "");
      setCloudflareAccount(localStorage.getItem("cloudflare_account_id") || "");
    }
  }, []);

  async function handleSaveKeys() {
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/settings/save-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          geminiApiKey: geminiKey,
          cloudflareApiToken: cloudflareToken,
          cloudflareAccountId: cloudflareAccount
        }),
      });

      if (!res.ok) throw new Error("Failed to save API keys");

      localStorage.setItem("gemini_api_key", geminiKey);
      localStorage.setItem("cloudflare_api_token", cloudflareToken);
      localStorage.setItem("cloudflare_account_id", cloudflareAccount);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (err) {
      console.error(err);
      setSaveStatus("error");
    }
  }

  return (
    <ProjectGuard>
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-gray-400 mt-1">Manage your workspace, team, and integrations.</p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 p-1 rounded-xl w-fit"
          style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
          {tabs.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: activeTab === tab ? "rgba(99,102,241,0.2)" : "transparent",
                color: activeTab === tab ? "#818cf8" : "var(--muted-fg)",
              }}>
              {tab}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "Profile" && (
            <motion.div key="profile" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="space-y-4 max-w-xl animate-fade-in">
              <div>
                <h2 className="text-base font-semibold">User Profile Settings</h2>
                <p className="text-xs text-gray-400 mt-0.5">Manage your personal profile details and database synchronization.</p>
              </div>

              <div className="rounded-xl p-5 space-y-6" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
                {profileLoading ? (
                  <div className="text-xs text-gray-500 py-4 animate-pulse">Loading profile data...</div>
                ) : (
                  <>
                    {/* Avatar Preview & URL */}
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center bg-zinc-800 border border-zinc-700 flex-shrink-0">
                        {profileImage ? (
                          <img src={profileImage} alt={profileName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xl font-bold text-lime-400">
                            {profileName.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase() || "FI"}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-semibold text-gray-300 block mb-1.5">Avatar Image URL</label>
                        <input 
                          type="text" 
                          value={profileImage} 
                          onChange={(e) => setProfileImage(e.target.value)}
                          placeholder="https://example.com/avatar.png"
                          className="w-full bg-[#161616] text-xs outline-none px-3 py-2 rounded-lg border border-white/5 text-white focus:border-lime-400/50 transition-colors" 
                        />
                      </div>
                    </div>

                    {/* Email Input (Read-only) */}
                    <div>
                      <label className="text-xs font-semibold text-gray-300 block mb-1.5">Email Address</label>
                      <input 
                        type="text" 
                        value={profileEmail} 
                        readOnly 
                        className="w-full bg-[#161616] text-xs outline-none px-3 py-2 rounded-lg border border-white/5 text-gray-500 cursor-not-allowed" 
                      />
                      <p className="text-[10px] text-gray-600 mt-1">Your email is managed by your Google Auth login and cannot be changed.</p>
                    </div>

                    {/* Name Input */}
                    <div>
                      <label className="text-xs font-semibold text-gray-300 block mb-1.5">Full Name</label>
                      <input 
                        type="text" 
                        value={profileName} 
                        onChange={(e) => setProfileName(e.target.value)}
                        placeholder="Founder Name"
                        className="w-full bg-[#161616] text-xs outline-none px-3 py-2 rounded-lg border border-white/5 text-white focus:border-lime-400/50 transition-colors" 
                      />
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end pt-2">
                      <button 
                        onClick={handleSaveProfile}
                        disabled={profileUpdating}
                        className="px-4 py-2 rounded-lg text-xs font-semibold text-black transition-all hover:brightness-110 active:scale-95"
                        style={{ background: "var(--accent)" }}>
                        {profileUpdating ? "Saving..." : profileUpdateStatus === "saved" ? "✓ Saved" : profileUpdateStatus === "error" ? "✕ Error" : "Save Changes"}
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Danger Zone */}
              <div className="rounded-xl p-5 border border-red-500/20 bg-red-500/5 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-red-400">Danger Zone</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Permanently delete your VentureIQ account and all associated data.</p>
                </div>

                {!deleteConfirmOpen ? (
                  <button 
                    onClick={() => setDeleteConfirmOpen(true)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-red-600/20 border border-red-600/40 hover:bg-red-600/30 transition-all">
                    Delete Account
                  </button>
                ) : (
                  <div className="space-y-3 p-3 rounded-lg border border-red-500/30 bg-red-950/20">
                    <p className="text-xs text-red-200 leading-relaxed font-semibold">
                      ⚠️ Are you absolutely sure? This will delete your profile and purge all your projects, chat logs, and configurations from the database. This action is irreversible.
                    </p>
                    <div className="flex gap-2">
                      <button 
                        onClick={handleDeleteAccount}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors">
                        Yes, delete my account permanently
                      </button>
                      <button 
                        onClick={() => setDeleteConfirmOpen(false)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-400 hover:text-white transition-colors"
                        style={{ background: "#222" }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "Team" && (
            <motion.div key="team" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="space-y-4 max-w-2xl">

              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">Team members <span className="text-gray-500 font-normal text-sm ml-1">({members.length})</span></h2>
                <button onClick={() => setShowInvite(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                  style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                  + Invite member
                </button>
              </div>

              {showInvite && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl p-4" style={{ background: "var(--card-bg)", border: "1px solid rgba(99,102,241,0.3)" }}>
                  <p className="text-sm font-medium mb-3">Invite new member</p>
                  <div className="flex gap-2">
                    <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="colleague@company.com"
                      className="flex-1 bg-transparent text-sm outline-none px-3 py-2 rounded-lg"
                      style={{ background: "var(--background)", border: "1px solid var(--card-border)", color: "white" }} />
                    <select className="text-sm px-2 py-2 rounded-lg"
                      style={{ background: "var(--background)", border: "1px solid var(--card-border)", color: "var(--muted-fg)" }}>
                      <option>Developer</option>
                      <option>Admin</option>
                      <option>Viewer</option>
                    </select>
                    <button className="px-3 py-2 rounded-lg text-sm font-medium text-white"
                      style={{ background: "var(--accent)" }}>
                      Send invite
                    </button>
                    <button onClick={() => setShowInvite(false)}
                      className="px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-white transition-colors">
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}

              <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--card-border)" }}>
                {members.map((m, i) => (
                  <div key={m.email}
                    className="flex items-center gap-4 px-5 py-4 border-b last:border-0 hover:bg-white/2 transition-colors"
                    style={{ borderColor: "var(--card-border)" }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ background: `${m.color}20`, color: m.color }}>
                      {m.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{m.name}</p>
                      <p className="text-xs text-gray-500">{m.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-600">Last active: {m.lastActive}</span>
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                        style={{ background: roleStyle[m.role]?.bg, color: roleStyle[m.role]?.text }}>
                        {m.role}
                      </span>
                      {m.role !== "Owner" && (
                        <button className="text-gray-600 hover:text-gray-300 transition-colors text-sm">⋯</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "General" && (
            <motion.div key="general" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="space-y-4 max-w-xl">
              <h2 className="text-base font-semibold">Workspace settings</h2>
              <div className="rounded-xl p-5 space-y-4" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
                {[
                  { label: "Workspace name", value: "Studio AI", type: "text" },
                  { label: "Timezone", value: "UTC+0 · London", type: "select" },
                  { label: "Default model", value: "claude-sonnet-4.5", type: "select" },
                ].map((f) => (
                  <div key={f.label}>
                    <label className="text-xs font-medium text-gray-400 block mb-1.5">{f.label}</label>
                    <input defaultValue={f.value}
                      className="w-full bg-transparent text-sm outline-none px-3 py-2 rounded-lg"
                      style={{ background: "var(--background)", border: "1px solid var(--card-border)", color: "white" }} />
                  </div>
                ))}
                <button className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                  style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                  Save changes
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === "Billing" && (
            <motion.div key="billing" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="space-y-4 max-w-xl">
              <h2 className="text-base font-semibold">Billing & usage</h2>
              <div className="rounded-xl p-5 space-y-4" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Pro Plan</p>
                    <p className="text-xs text-gray-400 mt-0.5">$149/month · renews July 10, 2026</p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{ background: "rgba(16,185,129,0.1)", color: "#34d399" }}>Active</span>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-400">Universal credit usage</span>
                    <span>8,420 / 10,000</span>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--background)" }}>
                    <div className="h-full rounded-full" style={{ width: "84.2%", background: "linear-gradient(90deg,#6366f1,#8b5cf6)" }} />
                  </div>
                </div>
                <button className="w-full py-2 rounded-lg text-sm font-semibold text-white"
                  style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                  Upgrade to Enterprise
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === "API Keys" && (
            <motion.div key="api" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="space-y-4 max-w-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">API Keys</h2>
                <button className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                  style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                  + Generate key
                </button>
              </div>

              {/* API Keys Configuration Card */}
              <div className="rounded-xl p-5 space-y-6" style={{ background: "var(--card-bg)", border: "1px solid rgba(218, 242, 100, 0.2)" }}>
                <div>
                  <h3 className="text-sm font-semibold text-white">Model Provider API Keys</h3>
                  <p className="text-xs text-gray-400 mt-1">Configure your Google Gemini & Cloudflare API keys.</p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-300 block mb-1.5">Gemini API Key (Fallback Vector Embeddings & LLM)</label>
                    <input 
                      type="password"
                      value={geminiKey}
                      onChange={(e) => setGeminiKey(e.target.value)}
                      placeholder="Enter your GEMINI_API_KEY..."
                      className="w-full bg-[#161616] text-xs outline-none px-3 py-2 rounded-lg font-mono border border-white/5 text-white" 
                    />
                    <p className="text-[10px] text-gray-500 mt-1">Used as fallback embeddings and LLM provider.</p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-300 block mb-1.5">Cloudflare API Token (Primary Workers AI)</label>
                    <input 
                      type="password"
                      value={cloudflareToken}
                      onChange={(e) => setCloudflareToken(e.target.value)}
                      placeholder="Enter your CLOUDFLARE_API token..."
                      className="w-full bg-[#161616] text-xs outline-none px-3 py-2 rounded-lg font-mono border border-white/5 text-white" 
                    />
                    <p className="text-[10px] text-gray-500 mt-1">Primary key for Llama 3.3 and BGE embeddings.</p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-300 block mb-1.5">Cloudflare Account ID</label>
                    <input 
                      type="text"
                      value={cloudflareAccount}
                      onChange={(e) => setCloudflareAccount(e.target.value)}
                      placeholder="Enter your CLOUDFLARE_ACCOUNT_ID..."
                      className="w-full bg-[#161616] text-xs outline-none px-3 py-2 rounded-lg font-mono border border-white/5 text-white" 
                    />
                    <p className="text-[10px] text-gray-500 mt-1">Required to build Cloudflare Workers AI resource endpoints.</p>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button 
                    onClick={handleSaveKeys}
                    disabled={saveStatus === "saving"}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-black transition-all"
                    style={{ background: "var(--accent)" }}>
                    {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "✓ Saved" : saveStatus === "error" ? "✕ Error" : "Save keys"}
                  </button>
                </div>
              </div>

              <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--card-border)" }}>
                {[
                  { name: "Production API", key: "sk-live-••••••••Kx9p", created: "Jan 12, 2026", lastUsed: "2 min ago",  status: "active" },
                  { name: "Development",    key: "sk-test-••••••••Mn4r", created: "Mar 4, 2026",  lastUsed: "4h ago",     status: "active" },
                  { name: "Stripe webhook", key: "sk-live-••••••••Zq2w", created: "Dec 1, 2025",  lastUsed: "3 days ago", status: "expiring" },
                ].map((k) => (
                  <div key={k.name} className="flex items-center gap-4 px-5 py-4 border-b last:border-0"
                    style={{ borderColor: "var(--card-border)" }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{k.name}</p>
                      <p className="text-xs font-mono text-gray-500 mt-0.5">{k.key}</p>
                      <p className="text-xs text-gray-600 mt-0.5">Created {k.created} · Last used {k.lastUsed}</p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                      style={{
                        background: k.status === "active" ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
                        color: k.status === "active" ? "#34d399" : "#fbbf24"
                      }}>
                      {k.status}
                    </span>
                    <button className="text-xs px-2.5 py-1 rounded-lg"
                      style={{ background: "var(--background)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "Integrations" && (
            <motion.div key="integrations" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="space-y-4 max-w-xl">
              <h2 className="text-base font-semibold">Integrations</h2>
              <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--card-border)" }}>
                {[
                  { name: "Slack",      desc: "Send notifications to channels",  connected: true,  color: "#818cf8" },
                  { name: "GitHub",     desc: "Trigger workflows on PR events",   connected: true,  color: "#34d399" },
                  { name: "Stripe",     desc: "Automate billing workflows",       connected: true,  color: "#34d399" },
                  { name: "HubSpot",    desc: "Sync leads and contacts",          connected: false, color: "#f59e0b" },
                  { name: "Notion",     desc: "Publish outputs to pages",         connected: false, color: "#4a4a6a" },
                  { name: "Jira",       desc: "Create and update issues",         connected: false, color: "#4a4a6a" },
                ].map((int) => (
                  <div key={int.name} className="flex items-center gap-4 px-5 py-4 border-b last:border-0"
                    style={{ borderColor: "var(--card-border)" }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold"
                      style={{ background: `${int.color}20`, color: int.color }}>
                      {int.name[0]}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{int.name}</p>
                      <p className="text-xs text-gray-500">{int.desc}</p>
                    </div>
                    <button className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                      style={{
                        background: int.connected ? "rgba(16,185,129,0.1)" : "rgba(99,102,241,0.1)",
                        color: int.connected ? "#34d399" : "#818cf8",
                        border: `1px solid ${int.connected ? "rgba(16,185,129,0.2)" : "rgba(99,102,241,0.2)"}`,
                      }}>
                      {int.connected ? "✓ Connected" : "Connect"}
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
    </ProjectGuard>
  );
}
