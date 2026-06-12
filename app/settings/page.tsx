"use client";
import ProjectGuard from "@/components/ProjectGuard";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";

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

const tabs = ["Team", "General", "Billing", "API Keys", "Integrations"];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("Team");
  const [inviteEmail, setInviteEmail] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [geminiKey, setGeminiKey] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setGeminiKey(localStorage.getItem("gemini_api_key") || "");
    }
  }, []);

  async function handleSaveKeys() {
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/settings/save-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ geminiApiKey: geminiKey }),
      });

      if (!res.ok) throw new Error("Failed to save API keys");

      localStorage.setItem("gemini_api_key", geminiKey);
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
                  <p className="text-xs text-gray-400 mt-1">Configure your Google Gemini API key.</p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-300 block mb-1.5">Gemini API Key (Vector Embeddings & LLM Tasks)</label>
                    <input 
                      type="password"
                      value={geminiKey}
                      onChange={(e) => setGeminiKey(e.target.value)}
                      placeholder="Enter your GEMINI_API_KEY..."
                      className="w-full bg-[#161616] text-xs outline-none px-3 py-2 rounded-lg font-mono border border-white/5 text-white" 
                    />
                    <p className="text-[10px] text-gray-500 mt-1">Used to generate text-embedding-004 vectors and run Gemini-based agent workflows.</p>
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
