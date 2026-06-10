"use client";
import ProjectGuard from "@/components/ProjectGuard";
import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";

type Severity = "warning" | "success" | "info" | "error";

interface Notification {
  id: number;
  title: string;
  body: string;
  time: string;
  severity: Severity;
  agent?: string;
  read: boolean;
  action?: string;
}

const initialNotifications: Notification[] = [
  { id: 1, title: "Helios needs approval", body: "Outbound email to 142 contacts pending review before send.", time: "Just now", severity: "warning", agent: "Helios", read: false, action: "Review" },
  { id: 2, title: "Workflow completed", body: "Lead-to-Demo Pipeline finished successfully in 4m 12s. 3 demos booked.", time: "8 min ago", severity: "success", agent: "Orion", read: false, action: "View run" },
  { id: 3, title: "Orion load high", body: "CPU usage at 91% — task queue backing up. Consider scaling.", time: "22 min ago", severity: "error", agent: "Orion", read: false, action: "Scale" },
  { id: 4, title: "API key expiring", body: "Stripe API key expires in 3 days. Rotate to avoid service interruption.", time: "1h ago", severity: "warning", read: false, action: "Rotate" },
  { id: 5, title: "New agent template", body: "A new 'Customer Churn Responder' template is available in the gallery.", time: "Yesterday", severity: "info", read: true, action: "View" },
  { id: 6, title: "Atlas memory upgraded", body: "Long-term memory expanded to 50k vectors. Research quality improved.", time: "Yesterday", severity: "success", agent: "Atlas", read: true },
  { id: 7, title: "Weekly brief delivered", body: "Competitive intelligence report for W23 ready in Conversations.", time: "2 days ago", severity: "info", agent: "Echo", read: true, action: "Open" },
  { id: 8, title: "Rate limit hit", body: "OpenAI rate limit reached at 03:40. Orion switched to fallback model.", time: "2 days ago", severity: "warning", agent: "Orion", read: true },
];

const severityConfig: Record<Severity, { bg: string; text: string; border: string; icon: string; dot: string }> = {
  warning: { bg: "rgba(245,158,11,0.08)", text: "#fbbf24", border: "rgba(245,158,11,0.25)", icon: "⚠", dot: "#fbbf24" },
  success: { bg: "rgba(16,185,129,0.08)", text: "#34d399", border: "rgba(16,185,129,0.25)", icon: "✓", dot: "#10b981" },
  error:   { bg: "rgba(239,68,68,0.08)",  text: "#f87171", border: "rgba(239,68,68,0.25)",  icon: "✕", dot: "#ef4444" },
  info:    { bg: "rgba(99,102,241,0.08)", text: "#818cf8", border: "rgba(99,102,241,0.25)", icon: "i", dot: "#6366f1" },
};

const agentColor: Record<string, string> = {
  Atlas: "#818cf8", Vega: "#34d399", Orion: "#fbbf24",
  Lyra: "#f472b6", Helios: "#a78bfa", Echo: "#2dd4bf",
};

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState(initialNotifications);
  const [filter, setFilter] = useState<"all" | Severity>("all");

  const filtered = filter === "all" ? notifs : notifs.filter((n) => n.severity === filter);
  const unread = notifs.filter((n) => !n.read).length;

  const markAllRead = () => setNotifs((p) => p.map((n) => ({ ...n, read: true })));
  const dismiss = (id: number) => setNotifs((p) => p.filter((n) => n.id !== id));
  const markRead = (id: number) => setNotifs((p) => p.map((n) => n.id === id ? { ...n, read: true } : n));

  return (
    <ProjectGuard>
    <DashboardLayout>
      <div className="p-8 space-y-6 max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Notifications</h1>
              {unread > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                  style={{ background: "var(--accent)", color: "white" }}>
                  {unread} new
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400 mt-1">Agent alerts, approvals, and system events.</p>
          </div>
          <button onClick={markAllRead}
            className="text-xs px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: "#818cf8", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}>
            Mark all read
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {(["all", "warning", "error", "success", "info"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all"
              style={{
                background: filter === f ? "rgba(99,102,241,0.2)" : "var(--card-bg)",
                color: filter === f ? "#818cf8" : "var(--muted-fg)",
                border: filter === f ? "1px solid rgba(99,102,241,0.4)" : "1px solid var(--card-border)",
              }}>
              {f}
              {f !== "all" && (
                <span className="ml-1.5 opacity-60">
                  {notifs.filter((n) => n.severity === f).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Notification list */}
        <div className="space-y-2">
          <AnimatePresence>
            {filtered.map((n) => {
              const cfg = severityConfig[n.severity];
              return (
                <motion.div key={n.id}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 40, scale: 0.96 }}
                  onClick={() => markRead(n.id)}
                  className="rounded-xl p-4 flex items-start gap-4 cursor-pointer transition-all"
                  style={{
                    background: !n.read ? cfg.bg : "var(--card-bg)",
                    border: `1px solid ${!n.read ? cfg.border : "var(--card-border)"}`,
                  }}>

                  {/* Severity icon */}
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5"
                    style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}>
                    {cfg.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold">{n.title}</span>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: cfg.dot }} />
                      )}
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed mb-2">{n.body}</p>
                    <div className="flex items-center gap-3">
                      {n.agent && (
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: `${agentColor[n.agent] ?? "#818cf8"}18`, color: agentColor[n.agent] ?? "#818cf8" }}>
                          {n.agent}
                        </span>
                      )}
                      <span className="text-xs text-gray-600">{n.time}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {n.action && (
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                        style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}>
                        {n.action}
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); dismiss(n.id); }}
                      className="text-gray-600 hover:text-gray-300 transition-colors text-lg leading-none px-1">
                      ×
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-600">
              <div className="text-4xl mb-3">◐</div>
              <p className="text-sm">No {filter !== "all" ? filter : ""} notifications</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
    </ProjectGuard>
  );
}
