"use client";
import ProjectGuard from "@/components/ProjectGuard";
import DashboardLayout from "@/components/DashboardLayout";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
} from "recharts";

const revenueData = [
  { month: "M1",  revenue: 0,    expenses: 45,  cashflow: -45 },
  { month: "M3",  revenue: 8,    expenses: 52,  cashflow: -44 },
  { month: "M6",  revenue: 28,   expenses: 65,  cashflow: -37 },
  { month: "M9",  revenue: 68,   expenses: 78,  cashflow: -10 },
  { month: "M12", revenue: 142,  expenses: 92,  cashflow: 50  },
  { month: "M18", revenue: 340,  expenses: 125, cashflow: 215 },
  { month: "M24", revenue: 680,  expenses: 175, cashflow: 505 },
  { month: "M36", revenue: 1420, expenses: 280, cashflow: 1140},
];

const yearlyRevenue = [
  { year: "Year 1", arr: 142,  mrr: 11.8 },
  { year: "Year 2", arr: 680,  mrr: 56.7 },
  { year: "Year 3", arr: 1420, mrr: 118 },
];

const unitEcon = [
  { metric: "ACV",           value: "$1,200",   sub: "Annual contract value (fleet)" },
  { metric: "CAC",           value: "$320",     sub: "Customer acquisition cost" },
  { metric: "LTV",           value: "$6,400",   sub: "Lifetime value (5yr avg)" },
  { metric: "LTV:CAC",       value: "20x",      sub: "Healthy > 3x" },
  { metric: "Payback Period",value: "3.2 mo",   sub: "Best-in-class < 12mo" },
  { metric: "Gross Margin",  value: "78%",      sub: "SaaS target > 70%" },
];

const fundingBreakdown = [
  { name: "Product & Eng",    pct: 40, color: "#daf264" },
  { name: "Sales & Marketing",pct: 25, color: "#c8e84a" },
  { name: "Operations",       pct: 20, color: "#7ab010" },
  { name: "G&A / Legal",      pct: 15, color: "#4a7a00" },
];

const ACC = "#daf264";

export default function FinancialsPage() {
  return (
    <ProjectGuard>
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span style={{ color: ACC }}>◆</span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ background: "rgba(218, 242, 100, 0.1)", color: ACC }}>Finance Agent · Running</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Financial Model</h1>
            <p className="text-sm mt-1" style={{ color: "var(--muted-fg)" }}>3-year projections · EV Startup India</p>
          </div>
          <div className="flex gap-2">
            <button className="text-xs px-3 py-2 rounded-lg" style={{ background: "var(--card-bg)", color: "var(--muted-fg)", border: "1px solid var(--card-border)" }}>↓ Excel</button>
            <button className="text-xs px-3 py-2 rounded-lg font-medium" style={{ background: ACC, color: "#0a0a0a" }}>↓ PDF Report</button>
          </div>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Seed Ask",        value: "$4.2M",  sub: "18-month runway",    highlight: true  },
            { label: "Break-even",      value: "Month 11", sub: "MRR crossover",    highlight: false },
            { label: "ARR at Year 3",   value: "$1.42M", sub: "Conservative case",  highlight: false },
            { label: "Target Valuation",value: "$18M",   sub: "Post-seed (8x ARR)", highlight: true  },
          ].map((m) => (
            <motion.div key={m.label} whileHover={{ y: -2 }}
              className="rounded-xl p-4"
              style={{
                background: m.highlight ? "rgba(218, 242, 100, 0.07)" : "var(--card-bg)",
                border: m.highlight ? "1px solid rgba(218, 242, 100, 0.25)" : "1px solid var(--card-border)",
              }}>
              <p className="text-xs mb-1" style={{ color: "var(--muted-fg)" }}>{m.label}</p>
              <p className="text-2xl font-bold" style={{ color: m.highlight ? ACC : "white" }}>{m.value}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted-fg)" }}>{m.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Revenue & cashflow chart */}
        <div className="rounded-xl p-5" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
          <h3 className="font-semibold text-sm text-white mb-1">Revenue vs Expenses vs Cash Flow</h3>
          <p className="text-xs mb-4" style={{ color: "var(--muted-fg)" }}>Monthly ($K) · 36-month forecast</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={ACC} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={ACC} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#818cf8" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#555" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#555" }} axisLine={false} tickLine={false} width={36}
                tickFormatter={(v) => `$${v}K`} />
              <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, fontSize: 11 }}
                formatter={(v: number, n: string) => [`$${v}K`, n]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke={ACC} strokeWidth={2} fill="url(#rg)" />
              <Area type="monotone" dataKey="cashflow" name="Cash Flow" stroke="#818cf8" strokeWidth={2} fill="url(#cg)" />
              <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={1.5} dot={false} strokeDasharray="4 3" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Unit economics + funding */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Unit economics */}
          <div className="rounded-xl p-5" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
            <h3 className="font-semibold text-sm text-white mb-4">Unit Economics</h3>
            <div className="grid grid-cols-2 gap-2">
              {unitEcon.map((u) => (
                <div key={u.metric} className="rounded-lg p-3"
                  style={{ background: "var(--background)", border: "1px solid var(--card-border)" }}>
                  <p className="text-xs" style={{ color: "var(--muted-fg)" }}>{u.metric}</p>
                  <p className="text-lg font-bold mt-0.5" style={{ color: ACC }}>{u.value}</p>
                  <p className="text-xs" style={{ color: "var(--muted-fg)" }}>{u.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Funding breakdown */}
          <div className="rounded-xl p-5" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
            <h3 className="font-semibold text-sm text-white mb-1">$4.2M Seed Allocation</h3>
            <p className="text-xs mb-4" style={{ color: "var(--muted-fg)" }}>18-month runway breakdown</p>
            <div className="space-y-3">
              {fundingBreakdown.map((f) => (
                <div key={f.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white">{f.name}</span>
                    <span style={{ color: ACC }}>{f.pct}% · ${(4.2 * f.pct / 100).toFixed(1)}M</span>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${f.pct}%` }}
                      transition={{ duration: 0.8 }} className="h-full rounded-full"
                      style={{ background: f.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
    </ProjectGuard>
  );
}
