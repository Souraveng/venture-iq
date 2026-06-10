"use client";
import ProjectGuard from "@/components/ProjectGuard";
import DashboardLayout from "@/components/DashboardLayout";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const slides = [
  { id: 1, title: "Cover",          icon: "✦", content: { headline: "EV Startup India", sub: "The Operating System for Fleet Electrification", badge: "Confidential · Seed Round 2026" } },
  { id: 2, title: "Problem",        icon: "⚠", content: { headline: "The EV Charging Gap", points: ["60% of fleet operators report daily range anxiety", "Only 1 in 8 charging stations has smart management", "No unified SaaS platform for fleet electrification in India"] } },
  { id: 3, title: "Solution",       icon: "◉", content: { headline: "AI-Powered EV Fleet OS", points: ["Real-time charging orchestration across all networks", "Predictive range & maintenance powered by ML", "Single dashboard for 1–10,000 vehicles"] } },
  { id: 4, title: "Market",         icon: "◎", content: { headline: "$2.4T Global EV Market", stats: [{ label: "TAM", value: "$2.4T" }, { label: "SAM", value: "$180B" }, { label: "SOM", value: "$4.2B" }] } },
  { id: 5, title: "Business Model", icon: "◆", content: { headline: "SaaS + Transaction Revenue", models: [{ type: "Fleet SaaS", price: "$100/vehicle/mo", note: "Annual contract" }, { type: "Charging Fee", price: "2.5% per kWh", note: "Transaction cut" }, { type: "Data API", price: "$1,200/mo", note: "Enterprise tier" }] } },
  { id: 6, title: "Competition",    icon: "⬡", content: { headline: "Our Competitive Moat", points: ["Only AI-native fleet management platform in India", "20x LTV:CAC vs industry average of 5x", "API-first: integrates with all major charging networks"] } },
  { id: 7, title: "Financials",     icon: "◈", content: { headline: "Path to Profitability", stats: [{ label: "Year 1 ARR", value: "$142K" }, { label: "Year 3 ARR", value: "$1.42M" }, { label: "Break-even", value: "Month 11" }] } },
  { id: 8, title: "Go-to-Market",   icon: "→", content: { headline: "3-Phase GTM Strategy", points: ["Phase 1: 50 fleet pilots in Delhi-NCR (6mo)", "Phase 2: Expand to top 8 metros + API partnerships", "Phase 3: South & East India + charging network integrations"] } },
  { id: 9, title: "Team",           icon: "◐", content: { headline: "The Founding Team", members: [{ name: "Founder & CEO", bg: "Ex-Ola, 8yr mobility", color: "#daf264" }, { name: "CTO", bg: "Ex-Google AI, ML specialist", color: "#daf264" }, { name: "VP Sales", bg: "Ex-Tata Motors, B2B fleet", color: "#daf264" }] } },
  { id: 10, title: "The Ask",        icon: "✦", content: { headline: "Raising $4.2M Seed", points: ["18-month runway to product-market fit", "Target: 200 fleet customers, $350K ARR", "Valuation: $18M post-money"] } },
];

export default function PitchPage() {
  const [active, setActive] = useState(0);
  const slide = slides[active];

  return (
    <ProjectGuard>
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span style={{ color: "var(--accent)" }}>✦</span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ background: "rgba(218, 242, 100, 0.1)", color: "var(--accent)" }}>Pitch Deck Agent · Waiting</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Investor Pitch Deck</h1>
            <p className="text-sm mt-1" style={{ color: "var(--muted-fg)" }}>10-slide deck · Auto-generated from agent outputs</p>
          </div>
          <div className="flex gap-2">
            <button className="text-xs px-3 py-2 rounded-lg" style={{ background: "var(--card-bg)", color: "var(--muted-fg)", border: "1px solid var(--card-border)" }}>↓ PPTX</button>
            <button className="text-xs px-3 py-2 rounded-lg font-medium" style={{ background: "var(--accent)", color: "#0a0a0a" }}>↓ PDF</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Slide thumbnails */}
          <div className="space-y-1.5 overflow-y-auto" style={{ maxHeight: 620 }}>
            {slides.map((s, i) => (
              <button key={s.id} onClick={() => setActive(i)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
                style={{
                  background: active === i ? "rgba(218, 242, 100, 0.08)" : "var(--card-bg)",
                  border: active === i ? "1px solid rgba(218, 242, 100, 0.3)" : "1px solid var(--card-border)",
                }}>
                <span className="text-base w-5 flex-shrink-0" style={{ color: active === i ? "var(--accent)" : "#555" }}>{s.icon}</span>
                <span className="text-xs font-medium" style={{ color: active === i ? "white" : "#888" }}>
                  {i + 1}. {s.title}
                </span>
              </button>
            ))}
          </div>

          {/* Slide preview */}
          <AnimatePresence mode="wait">
            <motion.div key={slide.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="lg:col-span-3 rounded-2xl overflow-hidden"
              style={{ background: "#0a0a0a", border: "1px solid #2a2a2a", minHeight: 400 }}>

              {/* Slide header bar */}
              <div className="flex items-center justify-between px-6 py-3 border-b" style={{ borderColor: "#1a1a1a" }}>
                <div className="flex items-center gap-2">
                  <span style={{ color: "var(--accent)", fontSize: 18 }}>{slide.icon}</span>
                  <span className="text-xs font-semibold text-white uppercase tracking-widest">{slide.title}</span>
                </div>
                <span className="text-xs" style={{ color: "#333" }}>{slide.id} / {slides.length}</span>
              </div>

              {/* Slide body */}
              <div className="p-10 flex flex-col justify-center min-h-80">
                {"headline" in slide.content && (
                  <h2 className="text-3xl font-bold text-white mb-6"
                    style={{ fontFamily: "'Playfair Display', serif" }}>
                    {slide.content.headline}
                  </h2>
                )}

                {"sub" in slide.content && (
                  <p className="text-lg mb-4" style={{ color: "#666" }}>{slide.content.sub}</p>
                )}
                {"badge" in slide.content && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium w-fit mt-2"
                    style={{ background: "rgba(218, 242, 100, 0.1)", color: "var(--accent)", border: "1px solid rgba(218, 242, 100, 0.2)" }}>
                    {slide.content.badge}
                  </span>
                )}

                {"points" in slide.content && Array.isArray((slide.content as {points: string[]}).points) && (
                  <ul className="space-y-4">
                    {(slide.content as {points: string[]}).points.map((p: string) => (
                      <li key={p} className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5"
                          style={{ background: "rgba(218, 242, 100, 0.12)", color: "var(--accent)" }}>→</span>
                        <span className="text-sm text-gray-300">{p}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {"stats" in slide.content && Array.isArray((slide.content as {stats: {label:string;value:string}[]}).stats) && (
                  <div className="flex gap-6 mt-4">
                    {(slide.content as {stats: {label:string;value:string}[]}).stats.map((s) => (
                      <div key={s.label} className="text-center">
                        <p className="text-4xl font-bold" style={{ color: "var(--accent)" }}>{s.value}</p>
                        <p className="text-xs mt-1" style={{ color: "#555" }}>{s.label}</p>
                      </div>
                    ))}
                  </div>
                )}

                {"models" in slide.content && Array.isArray((slide.content as {models: {type:string;price:string;note:string}[]}).models) && (
                  <div className="grid grid-cols-3 gap-4">
                    {(slide.content as {models: {type:string;price:string;note:string}[]}).models.map((m) => (
                      <div key={m.type} className="rounded-xl p-4"
                        style={{ background: "#111", border: "1px solid #222" }}>
                        <p className="text-xs font-semibold mb-2" style={{ color: "var(--accent)" }}>{m.type}</p>
                        <p className="text-xl font-bold text-white">{m.price}</p>
                        <p className="text-xs mt-1" style={{ color: "#555" }}>{m.note}</p>
                      </div>
                    ))}
                  </div>
                )}

                {"members" in slide.content && Array.isArray((slide.content as {members: {name:string;bg:string;color:string}[]}).members) && (
                  <div className="flex gap-6">
                    {(slide.content as {members: {name:string;bg:string;color:string}[]}).members.map((m) => (
                      <div key={m.name} className="text-center">
                        <div className="w-14 h-14 rounded-2xl mx-auto mb-2 flex items-center justify-center text-xl font-bold"
                          style={{ background: "rgba(218, 242, 100, 0.1)", color: m.color }}>
                          {m.name[0]}
                        </div>
                        <p className="text-xs font-semibold text-white">{m.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#555" }}>{m.bg}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Nav arrows */}
              <div className="flex items-center justify-between px-6 py-3 border-t" style={{ borderColor: "#1a1a1a" }}>
                <button onClick={() => setActive(Math.max(0, active - 1))}
                  disabled={active === 0}
                  className="text-xs px-3 py-1.5 rounded-lg transition-all disabled:opacity-30"
                  style={{ background: "#111", color: "#888", border: "1px solid #222" }}>
                  ← Previous
                </button>
                <div className="flex gap-1">
                  {slides.map((_, i) => (
                    <button key={i} onClick={() => setActive(i)}
                      className="w-1.5 h-1.5 rounded-full transition-all"
                      style={{ background: i === active ? "var(--accent)" : "#333" }} />
                  ))}
                </div>
                <button onClick={() => setActive(Math.min(slides.length - 1, active + 1))}
                  disabled={active === slides.length - 1}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all disabled:opacity-30"
                  style={{ background: "var(--accent)", color: "#0a0a0a" }}>
                  Next →
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
    </ProjectGuard>
  );
}
