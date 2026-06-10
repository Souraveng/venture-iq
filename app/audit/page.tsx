"use client";
import ProjectGuard from "@/components/ProjectGuard";
import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { motion } from "framer-motion";

const auditLog = [
  { ts: "10/06/2026, 01:15:51", user: "Sarah Chen",   avatar: "SC", action: "edited.instructions",  target: "Atlas",           ip: "192.168.1.42", severity: "medium" },
  { ts: "10/06/2026, 01:08:51", user: "Marcus Lee",   avatar: "ML", action: "executed.workflow",     target: "Lead-to-Demo",    ip: "10.0.0.55",   severity: "low"    },
  { ts: "10/06/2026, 01:01:51", user: "auto.scaled",  avatar: "SY", action: "scaled.agent",          target: "Orion ×3",        ip: "system",       severity: "info"   },
  { ts: "10/06/2026, 00:54:51", user: "Priya Patel",  avatar: "PP", action: "approved.outreach",     target: "142 contacts",    ip: "172.16.0.8",  severity: "medium" },
  { ts: "10/06/2026, 00:47:51", user: "system",       avatar: "SY", action: "rotated.api_key",       target: "Stripe",          ip: "system",       severity: "info"   },
  { ts: "10/06/2026, 00:40:51", user: "Sarah Chen",   avatar: "SC", action: "paused.agent",          target: "Cipher",          ip: "192.168.1.42", severity: "medium" },
  { ts: "10/06/2026, 00:33:51", user: "system",       avatar: "SY", action: "rate_limit.hit",        target: "OpenAI",          ip: "system",       severity: "high"   },
  { ts: "10/06/2026, 00:26:51", user: "Demo Admin",   avatar: "DA", action: "invited.member",        target: "Aisha Mohamed",   ip: "203.0.113.9", severity: "low"    },
  { ts: "10/06/2026, 00:19:51", user: "Marcus Lee",   avatar: "ML", action: "deleted.workflow",      target: "Draft Pipeline",  ip: "10.0.0.55",   severity: "high"   },
  { ts: "10/06/2026, 00:12:51", user: "Priya Patel",  avatar: "PP", action: "updated.billing",       target: "Pro plan",        ip: "172.16.0.8",  severity: "medium" },
  { ts: "10/06/2026, 00:05:51", user: "system",       avatar: "SY", action: "backup.completed",      target: "workspace-db",    ip: "system",       severity: "info"   },
  { ts: "09/06/2026, 23:58:51", user: "Sarah Chen",   avatar: "SC", action: "created.workflow",      target: "Churn Predictor", ip: "192.168.1.42", severity: "low"    },
  { ts: "09/06/2026, 23:51:51", user: "system",       avatar: "SY", action: "memory.pruned",         target: "Vega 40k→30k",   ip: "system",       severity: "info"   },
  { ts: "09/06/2026, 23:44:51", user: "Diego Alvarez",avatar: "DV", action: "viewed.audit_log",      target: "all",             ip: "198.51.100.4", severity: "info"   },
  { ts: "09/06/2026, 23:37:51", user: "Demo Admin",   avatar: "DA", action: "changed.role",          target: "Marcus → Admin",  ip: "203.0.113.9", severity: "high"   },
];

const severityStyle: Record<string, { color: string; bg: string }> = {
  high:   { color: "#f87171", bg: "rgba(239,68,68,0.1)"    },
  medium: { color: "#fbbf24", bg: "rgba(245,158,11,0.1)"   },
  low:    { color: "#34d399", bg: "rgba(16,185,129,0.1)"   },
  info:   { color: "#818cf8", bg: "rgba(99,102,241,0.1)"   },
};

const actionColor: Record<string, string> = {
  "edited":    "#818cf8",
  "executed":  "#34d399",
  "scaled":    "#2dd4bf",
  "approved":  "#10b981",
  "rotated":   "#f472b6",
  "paused":    "#f59e0b",
  "rate_limit":"#ef4444",
  "invited":   "#6366f1",
  "deleted":   "#ef4444",
  "updated":   "#fbbf24",
  "backup":    "#34d399",
  "created":   "#818cf8",
  "memory":    "#a78bfa",
  "viewed":    "#4a4a6a",
  "changed":   "#ef4444",
};

function getActionColor(action: string) {
  const prefix = action.split(".")[0];
  return actionColor[prefix] ?? "#4a4a6a";
}

const avatarColors: Record<string, string> = {
  SC: "#818cf8", ML: "#34d399", SY: "#4a4a6a",
  PP: "#f472b6", DA: "#fbbf24", DV: "#2dd4bf",
};

export default function AuditPage() {
  const [search, setSearch] = useState("");
  const [sevFilter, setSevFilter] = useState("all");

  const filtered = auditLog.filter((e) => {
    const matchSearch = search === "" ||
      e.user.toLowerCase().includes(search.toLowerCase()) ||
      e.action.toLowerCase().includes(search.toLowerCase()) ||
      e.target.toLowerCase().includes(search.toLowerCase());
    const matchSev = sevFilter === "all" || e.severity === sevFilter;
    return matchSearch && matchSev;
  });

  return (
    <ProjectGuard>
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Audit Log</h1>
          <p className="text-sm text-gray-400 mt-1">Complete record of all workspace activity and changes.</p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-48 flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
            <span className="text-gray-500 text-sm">⌕</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users, actions, targets…"
              className="bg-transparent text-sm outline-none flex-1 placeholder-gray-600" />
          </div>
          <div className="flex gap-2">
            {["all", "high", "medium", "low", "info"].map((s) => (
              <button key={s} onClick={() => setSevFilter(s)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all"
                style={{
                  background: sevFilter === s ? (severityStyle[s]?.bg ?? "rgba(99,102,241,0.2)") : "var(--card-bg)",
                  color: sevFilter === s ? (severityStyle[s]?.color ?? "#818cf8") : "var(--muted-fg)",
                  border: `1px solid ${sevFilter === s ? (severityStyle[s]?.color ?? "#818cf8") + "40" : "var(--card-border)"}`,
                }}>
                {s}
              </button>
            ))}
          </div>
          <button className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ background: "var(--card-bg)", color: "var(--muted-fg)", border: "1px solid var(--card-border)" }}>
            ↓ Export CSV
          </button>
        </div>

        {/* Table */}
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--card-border)" }}>
          <div className="grid text-xs font-semibold px-4 py-3"
            style={{
              gridTemplateColumns: "180px 1fr 1fr 1fr 80px 80px",
              background: "var(--card-bg)",
              borderBottom: "1px solid var(--card-border)",
              color: "var(--muted-fg)"
            }}>
            <span>Timestamp</span>
            <span>User</span>
            <span>Action</span>
            <span>Target</span>
            <span>IP</span>
            <span>Severity</span>
          </div>

          <div style={{ background: "var(--background)" }}>
            {filtered.map((entry, i) => {
              const sev = severityStyle[entry.severity];
              return (
                <motion.div key={i}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="grid px-4 py-3 text-xs border-b hover:bg-white/2 transition-colors"
                  style={{
                    gridTemplateColumns: "180px 1fr 1fr 1fr 80px 80px",
                    borderColor: "var(--card-border)",
                    alignItems: "center",
                  }}>
                  <span className="font-mono text-gray-500" style={{ fontSize: 10 }}>{entry.ts}</span>

                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: `${avatarColors[entry.avatar] ?? "#4a4a6a"}20`, color: avatarColors[entry.avatar] ?? "#4a4a6a" }}>
                      {entry.avatar}
                    </div>
                    <span className="truncate">{entry.user}</span>
                  </div>

                  <span className="font-mono px-2 py-0.5 rounded-md inline-block"
                    style={{ background: `${getActionColor(entry.action)}15`, color: getActionColor(entry.action), fontSize: 10 }}>
                    {entry.action}
                  </span>

                  <span className="text-gray-400 truncate">{entry.target}</span>

                  <span className="font-mono text-gray-600" style={{ fontSize: 10 }}>{entry.ip}</span>

                  <span className="px-2 py-0.5 rounded-full text-center font-medium"
                    style={{ background: sev.bg, color: sev.color, fontSize: 10 }}>
                    {entry.severity}
                  </span>
                </motion.div>
              );
            })}

            {filtered.length === 0 && (
              <div className="text-center py-12 text-gray-600 text-sm">
                No matching log entries
              </div>
            )}
          </div>
        </div>

        <p className="text-xs text-gray-600 text-center">
          Showing {filtered.length} of {auditLog.length} entries · Logs retained for 90 days
        </p>
      </div>
    </DashboardLayout>
    </ProjectGuard>
  );
}
