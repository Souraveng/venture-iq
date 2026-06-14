"use client";
import ProjectGuard from "@/components/ProjectGuard";
import DashboardLayout from "@/components/DashboardLayout";
import { useProjectStore, NotificationItem } from "@/store/useProjectStore";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/context/TranslationContext";

type Severity = "warning" | "success" | "error" | "info";

const severityConfig: Record<Severity, { bg: string; text: string; border: string; icon: string; dot: string }> = {
  warning: { bg: "rgba(245,158,11,0.08)", text: "#fbbf24", border: "rgba(245,158,11,0.25)", icon: "⚠", dot: "#fbbf24" },
  success: { bg: "rgba(16,185,129,0.08)", text: "#34d399", border: "rgba(16,185,129,0.25)", icon: "✓", dot: "#10b981" },
  error:   { bg: "rgba(239,68,68,0.08)",  text: "#f87171", border: "rgba(239,68,68,0.25)",  icon: "✕", dot: "#ef4444" },
  info:    { bg: "rgba(99,102,241,0.08)", text: "#818cf8", border: "rgba(99,102,241,0.25)", icon: "i", dot: "#6366f1" },
};

const agentColor: Record<string, string> = {
  "Opportunity Understanding": "#daf264",
  "Research Planner": "#daf264",
  "Evidence Researcher": "#daf264",
  "Fact Extractor": "#daf264",
  "Validation Agent": "#daf264",
  "Knowledge Retriever": "#daf264",
  "Market Intelligence": "#daf264",
  "Competitor Intelligence": "#daf264",
  "SWOT Intelligence": "#daf264",
  "Risk Intelligence": "#daf264",
  "Financial Intelligence": "#daf264",
  "Venture Analyst": "#daf264",
  "Founder Roadmap": "#daf264",
  "Decision Engine": "#daf264",
  "Report Generation": "#daf264"
};

export default function NotificationsPage() {
  const { projects, activeId, markNotificationsRead, dismissNotification } = useProjectStore();
  const activeProject = projects.find((p) => p.id === activeId);
  const { t } = useTranslation();

  const [filter, setFilter] = useState<"all" | Severity>("all");

  const notifs: NotificationItem[] = activeProject?.notifications ?? [];
  const filtered = filter === "all" ? notifs : notifs.filter((n) => n.severity === filter);
  const unread = notifs.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    if (activeProject) markNotificationsRead(activeId);
  };

  const handleDismiss = (id: number) => {
    if (activeProject) dismissNotification(activeId, id);
  };

  return (
    <ProjectGuard>
    <DashboardLayout>
      <div className="p-8 space-y-6 max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{t("notifications")}</h1>
              {unread > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold text-black"
                  style={{ background: "var(--accent)" }}>
                  {unread} {t("newNotifs")}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400 mt-1">{t("notificationsSub")}</p>
          </div>
          <button onClick={handleMarkAllRead}
            className="text-xs px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: "var(--accent)", background: "rgba(218,242,100,0.08)", border: "1px solid rgba(218,242,100,0.15)" }}>
            {t("markAllRead")}
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {(["all", "warning", "error", "success", "info"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
              style={{
                background: filter === f ? "rgba(99,102,241,0.2)" : "var(--card-bg)",
                color: filter === f ? "#818cf8" : "var(--muted-fg)",
                border: filter === f ? "1px solid rgba(99,102,241,0.4)" : "1px solid var(--card-border)",
              }}>
              {t("filter" + f.charAt(0).toUpperCase() + f.slice(1))}
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
                  className="rounded-xl p-4 flex items-start gap-4 transition-all"
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
                      <span className="text-sm font-semibold text-white">{n.title}</span>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: cfg.dot }} />
                      )}
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed mb-2">{n.body}</p>
                    <div className="flex items-center gap-3">
                      {n.agent && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(218,242,100,0.08)", color: "var(--accent)" }}>
                          {n.agent}
                        </span>
                      )}
                      <span className="text-[10px] text-gray-600">{n.time}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {n.action && (
                      <span className="text-[10px] px-2 py-1 rounded border border-white/10 bg-black/20 text-gray-400">
                        {n.action}
                      </span>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDismiss(n.id); }}
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
              <p className="text-sm">
                {filter === "all"
                  ? t("noNotifications")
                  : t("noFilterNotifications").replace("{filter}", t("filter" + filter.charAt(0).toUpperCase() + filter.slice(1)).toLowerCase())}
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
    </ProjectGuard>
  );
}
