"use client";
import ProjectGuard from "@/components/ProjectGuard";
import DashboardLayout from "@/components/DashboardLayout";
import { motion } from "framer-motion";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const perfData = [
  { day: "Mon", Atlas: 92, Vega: 88, Orion: 95, Lyra: 100 },
  { day: "Tue", Atlas: 96, Vega: 91, Orion: 97, Lyra: 99 },
  { day: "Wed", Atlas: 94, Vega: 93, Orion: 94, Lyra: 100 },
  { day: "Thu", Atlas: 99, Vega: 96, Orion: 98, Lyra: 100 },
  { day: "Fri", Atlas: 97, Vega: 94, Orion: 96, Lyra: 98 },
  { day: "Sat", Atlas: 95, Vega: 90, Orion: 99, Lyra: 100 },
  { day: "Sun", Atlas: 98, Vega: 95, Orion: 97, Lyra: 100 },
];

const costData = [
  { name: "Claude 4.5", value: 52, color: "#818cf8" },
  { name: "Gemini Flash", value: 18, color: "#34d399" },
  { name: "GPT-4o", value: 14, color: "#fbbf24" },
  { name: "Tools/API", value: 16, color: "#f472b6" },
];

const radarAtlas = [
  { skill: "Reasoning", Atlas: 95, Orion: 80 },
  { skill: "Speed", Atlas: 70, Orion: 92 },
  { skill: "Accuracy", Atlas: 97, Orion: 88 },
  { skill: "Cost", Atlas: 60, Orion: 75 },
  { skill: "Context", Atlas: 90, Orion: 72 },
];

const heatmapData = Array.from({ length: 7 }, (_, day) =>
  Array.from({ length: 24 }, (_, hr) => ({
    day, hr, v: Math.floor(Math.random() * 60 + (hr >= 9 && hr <= 18 ? 30 : 0)),
  }))
).flat();

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const COLORS = { Atlas: "#818cf8", Vega: "#34d399", Orion: "#fbbf24", Lyra: "#f472b6" };

export default function AnalyticsPage() {
  return (
    <ProjectGuard>
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="text-sm text-gray-400 mt-1">Performance · 30-day trends across your agent network.</p>
          </div>
          <div className="flex gap-2">
            {["7d", "30d", "90d"].map((r, i) => (
              <button key={r}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: i === 1 ? "rgba(99,102,241,0.2)" : "var(--card-bg)",
                  color: i === 1 ? "#818cf8" : "var(--muted-fg)",
                  border: i === 1 ? "1px solid rgba(99,102,241,0.4)" : "1px solid var(--card-border)",
                }}>
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Avg success score", value: "97.4", unit: "/100", color: "#10b981", delta: "+2.1" },
            { label: "Total tokens used", value: "312M",  unit: "",      color: "#6366f1", delta: "+18%" },
            { label: "Cost this month",   value: "$284",  unit: "",      color: "#f59e0b", delta: "-6%" },
            { label: "Tasks completed",   value: "12,847",unit: "",      color: "#8b5cf6", delta: "+31%" },
          ].map((k) => (
            <motion.div key={k.label} whileHover={{ y: -2 }}
              className="rounded-xl p-4"
              style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
              <p className="text-xs text-gray-500 mb-1">{k.label}</p>
              <p className="text-2xl font-bold">{k.value}<span className="text-sm text-gray-500">{k.unit}</span></p>
              <p className="text-xs mt-1 font-medium"
                style={{ color: k.delta.startsWith("+") ? "#10b981" : "#ef4444" }}>
                {k.delta} vs last period
              </p>
            </motion.div>
          ))}
        </div>

        {/* Agent performance line chart */}
        <div className="rounded-xl p-5" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
          <h3 className="font-semibold text-sm mb-1">Agent performance · 30 days</h3>
          <p className="text-xs text-gray-500 mb-4">Success score (0–100) by agent</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={perfData}>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#4a4a6a" }} axisLine={false} tickLine={false} />
              <YAxis domain={[80, 100]} tick={{ fontSize: 11, fill: "#4a4a6a" }} axisLine={false} tickLine={false} width={28} />
              <Tooltip contentStyle={{ background: "#1e1e2e", border: "1px solid #2a2a3e", borderRadius: 8, fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {(["Atlas", "Vega", "Orion", "Lyra"] as const).map((a) => (
                <Line key={a} type="monotone" dataKey={a} stroke={COLORS[a]}
                  strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Cost + Radar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Cost breakdown */}
          <div className="rounded-xl p-5" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
            <h3 className="font-semibold text-sm mb-1">Cost breakdown</h3>
            <p className="text-xs text-gray-500 mb-4">By model · last 30 days</p>
            <div className="space-y-3">
              {costData.map((c) => (
                <div key={c.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">{c.name}</span>
                    <span className="font-medium">{c.value}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--background)" }}>
                    <motion.div className="h-full rounded-full"
                      initial={{ width: 0 }} animate={{ width: `${c.value}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      style={{ background: c.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Radar: Atlas vs Orion */}
          <div className="rounded-xl p-5" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
            <h3 className="font-semibold text-sm mb-1">Capability radar</h3>
            <p className="text-xs text-gray-500 mb-2">Atlas vs Orion</p>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarAtlas}>
                <PolarGrid stroke="#1e1e2e" />
                <PolarAngleAxis dataKey="skill" tick={{ fontSize: 10, fill: "#6b6b8a" }} />
                <Radar name="Atlas" dataKey="Atlas" stroke="#818cf8" fill="#818cf8" fillOpacity={0.15} />
                <Radar name="Orion" dataKey="Orion" stroke="#fbbf24" fill="#fbbf24" fillOpacity={0.15} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "#1e1e2e", border: "1px solid #2a2a3e", borderRadius: 8, fontSize: 11 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity heatmap */}
        <div className="rounded-xl p-5" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
          <h3 className="font-semibold text-sm mb-1">Activity heatmap</h3>
          <p className="text-xs text-gray-500 mb-4">Tasks per hour · last 7 days</p>
          <div className="overflow-x-auto">
            <div className="inline-grid gap-0.5" style={{ gridTemplateColumns: `40px repeat(24, 1fr)`, minWidth: 600 }}>
              {/* Header row: hours */}
              <div />
              {Array.from({ length: 24 }, (_, h) => (
                <div key={h} className="text-center text-xs pb-1" style={{ color: "#4a4a6a", fontSize: 9 }}>
                  {h % 6 === 0 ? `${h}h` : ""}
                </div>
              ))}
              {/* Data rows */}
              {days.map((day, di) => (
                <>
                  <div key={`label-${day}`} className="text-right pr-2 text-xs flex items-center justify-end"
                    style={{ color: "#6b6b8a", fontSize: 10 }}>
                    {day}
                  </div>
                  {Array.from({ length: 24 }, (_, hr) => {
                    const cell = heatmapData.find((d) => d.day === di && d.hr === hr);
                    const intensity = cell ? cell.v / 90 : 0;
                    return (
                      <div key={`${di}-${hr}`}
                        title={`${day} ${hr}:00 — ${cell?.v ?? 0} tasks`}
                        className="rounded-sm"
                        style={{
                          height: 16,
                          background: intensity > 0
                            ? `rgba(99,102,241,${Math.min(0.9, intensity * 1.2)})`
                            : "rgba(255,255,255,0.03)",
                        }} />
                    );
                  })}
                </>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs text-gray-500">Less</span>
            {[0.05, 0.2, 0.4, 0.65, 0.9].map((o) => (
              <div key={o} className="w-3 h-3 rounded-sm" style={{ background: `rgba(99,102,241,${o})` }} />
            ))}
            <span className="text-xs text-gray-500">More</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
    </ProjectGuard>
  );
}
