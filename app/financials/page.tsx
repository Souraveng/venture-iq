"use client";
import ProjectGuard from "@/components/ProjectGuard";
import DashboardLayout from "@/components/DashboardLayout";
import { motion } from "framer-motion";
import { useProjectStore } from "@/store/useProjectStore";
import { useTranslatedReport } from "@/hooks/useTranslatedReport";
import { useTranslation } from "@/context/TranslationContext";
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
  const { t } = useTranslation();
  const { projects, activeId } = useProjectStore();
  const activeProject = projects.find((p) => p.id === activeId);

  const rawFi = activeProject?.financialIntel;
  const fi = useTranslatedReport(activeId, rawFi || null);
  const hasFinanceData = !!fi?.projection;

  // Formatting helpers
  const formatAmount = (val: number) => {
    return val >= 1000000 
      ? `$${(val / 1000000).toFixed(1)}M` 
      : `$${Math.round(val / 1000)}K`;
  };

  const seedAskValue = fi?.fundingRequirements?.capitalNeeded
    ? formatAmount(fi.fundingRequirements.capitalNeeded)
    : "$4.2M";
    
  const breakEvenValue = fi?.breakEvenAnalysis?.breakEvenTimelineMonths
    ? `Month ${fi.breakEvenAnalysis.breakEvenTimelineMonths}`
    : "Month 11";

  const arrY3Value = fi?.revenueForecast?.revenueProjections?.year3
    ? formatAmount(fi.revenueForecast.revenueProjections.year3)
    : "$1.42M";

  const valuationValue = fi?.revenueForecast?.revenueProjections?.year3
    ? formatAmount(fi.revenueForecast.revenueProjections.year3 * 10)
    : "$18M";

  const metrics = [
    { label: t("seedAsk") !== "seedAsk" ? t("seedAsk") : "Seed Ask",        value: seedAskValue,  sub: fi?.fundingRequirements?.fundingTimeline || "18-month runway", highlight: true  },
    { label: t("breakEven") !== "breakEven" ? t("breakEven") : "Break-even",      value: breakEvenValue, sub: "MRR crossover",    highlight: false },
    { label: t("arrYear3") !== "arrYear3" ? t("arrYear3") : "ARR at Year 3",   value: arrY3Value, sub: "Expected case",  highlight: false },
    { label: t("targetValuation") !== "targetValuation" ? t("targetValuation") : "Target Valuation",value: valuationValue,   sub: "Post-seed (10x ARR)", highlight: true  },
  ];

  const dynamicRevenueData = Array.isArray(fi?.cashFlowForecast?.forecast)
    ? fi.cashFlowForecast.forecast.map((item: any) => {
        if (!item || typeof item !== 'object') return { month: "", revenue: 0, expenses: 0, cashflow: 0 };
        return {
          month: item.period || "",
          revenue: typeof item.revenue === 'number' ? (item.revenue >= 1000 ? Math.round(item.revenue / 1000) : item.revenue) : 0,
          expenses: typeof item.expenses === 'number' ? (item.expenses >= 1000 ? Math.round(item.expenses / 1000) : item.expenses) : 0,
          cashflow: typeof item.cashflow === 'number' ? (item.cashflow >= 1000 ? Math.round(item.cashflow / 1000) : (item.cashflow <= -1000 ? Math.round(item.cashflow / 1000) : item.cashflow)) : 0
        };
      })
    : revenueData;

  const dynamicUnitEcon = fi?.unitEconomics && typeof fi.unitEconomics === 'object' && !Array.isArray(fi.unitEconomics)
    ? [
        { metric: "ACV",           value: typeof fi.unitEconomics.revenuePerCustomer === 'number' ? (fi.unitEconomics.revenuePerCustomer >= 1000 ? `$${(fi.unitEconomics.revenuePerCustomer / 1000).toFixed(1)}K` : `$${fi.unitEconomics.revenuePerCustomer}`) : "$0",   sub: "Annual contract value (fleet)" },
        { metric: "CAC",           value: `$${fi.unitEconomics.cac || 0}`,     sub: "Customer acquisition cost" },
        { metric: "LTV",           value: typeof fi.unitEconomics.ltv === 'number' ? (fi.unitEconomics.ltv >= 1000 ? `$${(fi.unitEconomics.ltv / 1000).toFixed(1)}K` : `$${fi.unitEconomics.ltv}`) : "$0",     sub: "Customer lifetime value" },
        { metric: "LTV:CAC",       value: `${fi.unitEconomics.ltvToCacRatio || 0}x`,      sub: "Healthy > 3x" },
        { metric: "Payback Period",value: `${fi.unitEconomics.paybackPeriod || 0} mo`,   sub: "Best-in-class < 12mo" },
        { metric: "Gross Margin",  value: `${fi.unitEconomics.grossMargin || 0}%`,      sub: "SaaS target > 70%" },
      ]
    : unitEcon;

  const dynamicFundingBreakdown = fi?.fundingRequirements?.allocation && typeof fi.fundingRequirements.allocation === 'object' && !Array.isArray(fi.fundingRequirements.allocation)
    ? [
        { name: "Product & Eng",    pct: fi.fundingRequirements.allocation.productEng || 0, color: "#daf264" },
        { name: "Sales & Marketing",pct: fi.fundingRequirements.allocation.salesMarketing || 0, color: "#c8e84a" },
        { name: "Operations",       pct: fi.fundingRequirements.allocation.operations || 0, color: "#7ab010" },
        { name: "G&A / Legal",      pct: fi.fundingRequirements.allocation.legalGna || 0, color: "#4a7a00" },
      ]
    : fundingBreakdown;

  return (
    <ProjectGuard>
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span style={{ color: ACC }}>◆</span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ 
                  background: hasFinanceData ? "rgba(218, 242, 100, 0.1)" : "rgba(251, 191, 36, 0.1)", 
                  color: hasFinanceData ? ACC : "#fbbf24" 
                }}>
                {t("financials") !== "financials" ? t("financials") : "Finance Agent"} · {hasFinanceData ? t("done") : (t("pendingRun") !== "pendingRun" ? t("pendingRun") : "Pending Run")}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white">{t("financialAnalysis")}</h1>
            <p className="text-sm mt-1" style={{ color: "var(--muted-fg)" }}>
              {t("financialAnalysisSub")} · {activeProject?.name || "EV Startup India"}
            </p>
          </div>
          <div className="flex gap-2">
            <button className="text-xs px-3 py-2 rounded-lg" style={{ background: "var(--card-bg)", color: "var(--muted-fg)", border: "1px solid var(--card-border)" }}>↓ {t("excel") !== "excel" ? t("excel") : "Excel"}</button>
            <button className="text-xs px-3 py-2 rounded-lg font-medium" style={{ background: ACC, color: "#0a0a0a" }}>↓ {t("pdfReport") !== "pdfReport" ? t("pdfReport") : "PDF Report"}</button>
          </div>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {metrics.map((m) => (
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

        {activeProject?.financialIntel?.projection && (
          <div className="rounded-xl p-5" style={{ background: "rgba(218, 242, 100, 0.05)", border: "1px solid rgba(218, 242, 100, 0.2)" }}>
            <h3 className="font-semibold text-sm text-white mb-2">{t("financialAnalysis")}</h3>
            <p className="text-xs leading-relaxed" style={{ color: "var(--muted-fg)" }}>
              {activeProject.financialIntel.projection}
            </p>
          </div>
        )}

        {/* Revenue & cashflow chart */}
        <div className="rounded-xl p-5" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
          <h3 className="font-semibold text-sm text-white mb-1">{t("revenueBreakdown")}</h3>
          <p className="text-xs mb-4" style={{ color: "var(--muted-fg)" }}>{t("monthlyInK") !== "monthlyInK" ? t("monthlyInK") : "Monthly ($K) · 36-month forecast"}</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={dynamicRevenueData}>
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
              <Area type="monotone" dataKey="revenue" name={t("revenue") !== "revenue" ? t("revenue") : "Revenue"} stroke={ACC} strokeWidth={2} fill="url(#rg)" />
              <Area type="monotone" dataKey="cashflow" name={t("cashflow") !== "cashflow" ? t("cashflow") : "Cash Flow"} stroke="#818cf8" strokeWidth={2} fill="url(#cg)" />
              <Line type="monotone" dataKey="expenses" name={t("expenses") !== "expenses" ? t("expenses") : "Expenses"} stroke="#ef4444" strokeWidth={1.5} dot={false} strokeDasharray="4 3" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Unit economics + funding */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Unit economics */}
          <div className="rounded-xl p-5" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
            <h3 className="font-semibold text-sm text-white mb-4">{t("unitEconomics")}</h3>
            <div className="grid grid-cols-2 gap-2">
              {dynamicUnitEcon.map((u: any) => (
                <div key={u.metric} className="rounded-lg p-3"
                  style={{ background: "var(--background)", border: "1px solid var(--card-border)" }}>
                  <p className="text-xs" style={{ color: "var(--muted-fg)" }}>{t(u.metric.toLowerCase()) !== u.metric.toLowerCase() ? t(u.metric.toLowerCase()) : u.metric}</p>
                  <p className="text-lg font-bold mt-0.5" style={{ color: ACC }}>{u.value}</p>
                  <p className="text-xs" style={{ color: "var(--muted-fg)" }}>{u.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Funding breakdown */}
          <div className="rounded-xl p-5" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
            <h3 className="font-semibold text-sm text-white mb-1">{seedAskValue} {t("allocationOfCapital")}</h3>
            <p className="text-xs mb-4" style={{ color: "var(--muted-fg)" }}>{t("runwayBreakdown") !== "runwayBreakdown" ? t("runwayBreakdown") : "Runway breakdown by operational segment"}</p>
            <div className="space-y-3">
              {dynamicFundingBreakdown.map((f: any) => (
                <div key={f.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white">{f.name}</span>
                    <span style={{ color: ACC }}>
                      {f.pct}% · {formatAmount(fi?.fundingRequirements?.capitalNeeded ? (fi.fundingRequirements.capitalNeeded * f.pct / 100) : (4200000 * f.pct / 100))}
                    </span>
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
