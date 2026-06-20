"use client";
import ProjectGuard from "@/components/ProjectGuard";
import DashboardLayout from "@/components/DashboardLayout";
import PremiumGate from "@/components/PremiumGate";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProjectStore } from "@/store/useProjectStore";
import { useTranslatedReport } from "@/hooks/useTranslatedReport";
import { useTranslation } from "@/context/TranslationContext";
import { MOCK_REPORTS_CONTAINER } from "@/lib/graph/report/examples";
import { ExportService, TemplateEngine } from "@/lib/graph/report/engines";

// Themes styling configurations for the simulator UI
const styleMap = {
  NORMAL: {
    bg: "bg-[#0a0a0a]",
    textColor: "text-[#f0f0f0]",
    accentColor: "#daf264",
    accentText: "text-[#daf264]",
    borderColor: "border-[#2a2a2a]",
    themeBadge: "bg-[#daf264]/10 text-[#daf264] border-[#daf264]/20",
    btnPrimary: "bg-[#daf264] text-[#0a0a0a] hover:bg-[#cbe355]",
    font: "font-sans"
  },
  INVESTOR: {
    bg: "bg-[#0f172a]",
    textColor: "text-slate-100",
    accentColor: "#38bdf8",
    accentText: "text-[#38bdf8]",
    borderColor: "border-slate-800",
    themeBadge: "bg-[#38bdf8]/10 text-[#38bdf8] border-[#38bdf8]/20",
    btnPrimary: "bg-[#38bdf8] text-[#0f172a] hover:bg-[#0ea5e9]",
    font: "font-serif"
  },
  ACCELERATOR: {
    bg: "bg-[#0f0f17]",
    textColor: "text-rose-50",
    accentColor: "#f43f5e",
    accentText: "text-[#f43f5e]",
    borderColor: "border-rose-950/20",
    themeBadge: "bg-[#f43f5e]/10 text-[#f43f5e] border-[#f43f5e]/20",
    btnPrimary: "bg-[#f43f5e] text-white hover:bg-[#e11d48]",
    font: "font-sans"
  },
  HACKATHON: {
    bg: "bg-[#09090b]",
    textColor: "text-zinc-100",
    accentColor: "#a855f7",
    accentText: "text-[#a855f7]",
    borderColor: "border-zinc-800",
    themeBadge: "bg-[#a855f7]/10 text-[#a855f7] border-[#a855f7]/20",
    btnPrimary: "bg-[#a855f7] text-white hover:bg-[#9333ea]",
    font: "font-mono"
  },
  CORPORATE: {
    bg: "bg-[#111827]",
    textColor: "text-gray-100",
    accentColor: "#2563eb",
    accentText: "text-[#2563eb]",
    borderColor: "border-gray-800",
    themeBadge: "bg-[#2563eb]/10 text-[#2563eb] border-[#2563eb]/20",
    btnPrimary: "bg-[#2563eb] text-white hover:bg-[#1d4ed8]",
    font: "font-sans"
  }
};

const getIcon = (slideNumber: number, title: string): string => {
  const t = title.toLowerCase();
  if (t.includes("cover") || t.includes("title")) return "✦";
  if (t.includes("problem")) return "⚠";
  if (t.includes("solution")) return "◉";
  if (t.includes("market") || t.includes("tam")) return "◎";
  if (t.includes("competition")) return "⬡";
  if (t.includes("business") || t.includes("model")) return "◆";
  if (t.includes("financial")) return "◈";
  if (t.includes("roadmap") || t.includes("product")) return "→";
  if (t.includes("funding") || t.includes("ask") || t.includes("capital")) return "✦";
  if (t.includes("why now")) return "◐";
  if (t.includes("closing") || t.includes("contact")) return "✦";
  return "✦";
};

export default function PitchPage() {
  const { t } = useTranslation();
  const { projects, activeId } = useProjectStore();
  const activeProject = projects.find((p) => p.id === activeId);

  const rawReportIntel = activeProject?.reportIntel;
  const translatedReportIntel = useTranslatedReport(activeId, rawReportIntel || null);
  
  // Fallback to MOCK_REPORTS_CONTAINER if reportIntel is missing
  const reports = translatedReportIntel && typeof translatedReportIntel === 'object' ? translatedReportIntel : MOCK_REPORTS_CONTAINER;
  const dynamicSlides = Array.isArray(reports?.pitchDeck) ? reports.pitchDeck : MOCK_REPORTS_CONTAINER.pitchDeck;

  const [activeTab, setActiveTab] = useState<"deck" | "reports">("deck");
  const [styleMode, setStyleMode] = useState<keyof typeof styleMap>("NORMAL");
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [activeReportKey, setActiveReportKey] = useState<string>("executiveSummary");

  const activeTheme = styleMap[styleMode];
  const activeSlide = ((dynamicSlides && dynamicSlides.length > 0)
    ? (dynamicSlides[activeSlideIdx] || dynamicSlides[0])
    : null) || {};

  const slide = {
    slideNumber: activeSlide.slideNumber ?? (activeSlideIdx + 1),
    title: activeSlide.title ?? `Slide ${activeSlideIdx + 1}`,
    headline: activeSlide.headline ?? "Project Deck Loading...",
    points: Array.isArray(activeSlide.points) ? activeSlide.points : ["No slide content available"],
    stats: Array.isArray(activeSlide.stats) ? activeSlide.stats : [],
    models: Array.isArray(activeSlide.models) ? activeSlide.models : [],
    members: Array.isArray(activeSlide.members) ? activeSlide.members : []
  };

  // Map of accessible reports for display
  const reportsMeta = [
    { key: "executiveSummary", label: t("executiveSummary"), desc: "1-3 page synthesis of core venture metrics", data: reports?.executiveSummary },
    { key: "businessPlan", label: t("businessPlan") !== "businessPlan" ? t("businessPlan") : "Business Plan", desc: "Structured operational proposal with 9 core sections", data: reports?.businessPlan },
    { key: "investorReport", label: t("investorReport") !== "investorReport" ? t("investorReport") : "Investor Due Diligence", desc: "Comprehensive investment viability and flags report", data: reports?.investorReport },
    { key: "founderRoadmap", label: t("founderRoadmap"), desc: "Tactical 30/90-Day milestone delivery program", data: reports?.founderRoadmap },
    { key: "opportunityAnalysis", label: t("opportunityAnalysis") !== "opportunityAnalysis" ? t("opportunityAnalysis") : "Opportunity Analysis", desc: "Evidence-backed multi-agent opportunity breakdown", data: reports?.opportunityAnalysis },
    { key: "onePageBrief", label: t("onePageBrief") !== "onePageBrief" ? t("onePageBrief") : "One-Page Executive Brief", desc: "Highly condensed high-conviction briefing summary", data: reports?.onePageBrief }
  ];

  const currentReport = reportsMeta.find(r => r.key === activeReportKey) || reportsMeta[0];

  // Helper function to serialize any report back into Markdown
  const serializeReportToMarkdown = (key: string, data: any): string => {
    if (!data || typeof data !== 'object') return `# ${key}\n\nNo report data available.`;
    if (key === "opportunityAnalysis") {
      return `# ${data.title || 'Opportunity Analysis'}\n\nOverall Score: **${data.overallScore || 0}/100**\n\n## Component Breakdown\n` +
        Object.entries(data.breakdown || {}).map(([k, v]) => `- **${k.replace(/([A-Z])/g, " $1")}**: ${v}/100`).join("\n") +
        `\n\n## Key Findings\n` + (Array.isArray(data.keyFindings) ? data.keyFindings : []).map((f: string) => `- ${f}`).join("\n");
    }
    if (key === "onePageBrief") {
      return `# ${data.title || 'One-Page Executive Brief'}\n\n${data.summary || ''}\n\n## Key Metrics\n` +
        (Array.isArray(data.keyMetrics) ? data.keyMetrics : []).map((m: any) => `- **${m?.label || ''}**: ${m?.value || ''}`).join("\n") +
        `\n\n## Recommended Actions\n` + (Array.isArray(data.recommendedActions) ? data.recommendedActions : []).map((a: string) => `- ${a}`).join("\n");
    }
    // Standard structured sections
    let md = `# ${data.title || key}\n\n`;
    for (const [secKey, secValue] of Object.entries(data.sections || {})) {
      const title = secKey.charAt(0).toUpperCase() + secKey.slice(1).replace(/([A-Z])/g, " $1");
      md += `## ${title}\n`;
      if (Array.isArray(secValue)) {
        md += secValue.map((item: string) => `- ${item}`).join("\n") + "\n\n";
      } else {
        md += `${secValue}\n\n`;
      }
    }
    return md;
  };

  // Helper function to compile and download as HTML
  const handleExportHtml = (key: string, data: any) => {
    const mdContent = serializeReportToMarkdown(key, data);
    let htmlContent = mdContent
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/^- (.*$)/gim, '<li>$1</li>');
      
    htmlContent = htmlContent.replace(/(<li>[\s\S]*<\/li>)/gm, '<ul>$1</ul>');
    const styledHtml = TemplateEngine.getStyledHtml(htmlContent, styleMode);
    ExportService.downloadTextFile(`${key}_report.html`, styledHtml);
  };

  // Helper function to download reports as Markdown
  const handleExportMarkdown = (key: string, data: any) => {
    const mdContent = serializeReportToMarkdown(key, data);
    ExportService.downloadTextFile(`${key}_report.md`, mdContent);
  };

  const handleExportJSON = () => {
    ExportService.downloadTextFile("ventureiq_deliverables.json", JSON.stringify(reports, null, 2));
  };

  const handlePrintPdf = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <ProjectGuard>
      <DashboardLayout>
        <PremiumGate>
          {/* Style injection for browser printing */}
        <style jsx global>{`
          @media print {
            body {
              background-color: #000 !important;
              color: #fff !important;
            }
            header, footer, nav, aside, button, .no-print {
              display: none !important;
            }
            #print-area {
              display: block !important;
              background-color: #000 !important;
              color: #fff !important;
              width: 100% !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            .print-page-break {
              page-break-after: always;
              break-after: page;
              border: none !important;
              background: transparent !important;
              color: #fff !important;
              padding: 2rem !important;
              margin: 0 !important;
              min-height: 100vh !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: center !important;
            }
          }
        `}</style>

        <div className="p-8 space-y-6 no-print">
          {/* Header section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(218, 242, 100, 0.1)", color: "var(--accent)" }}>
                  {t("reportEngineActive") !== "reportEngineActive" ? t("reportEngineActive") : "Report Engine Active"}
                </span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(255, 255, 255, 0.05)", color: "#888" }}>
                  {t("deckStats") !== "deckStats" ? t("deckStats") : "12-Slide Deck + 6 Reports"}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-white">{t("pitchDeckGenerator")}</h1>
              <p className="text-sm mt-1" style={{ color: "var(--muted-fg)" }}>
                {t("pitchDeckSub")}
              </p>
            </div>

            {/* Global Exporters */}
            <div className="flex items-center gap-2">
              <button onClick={handleExportJSON} className="text-xs px-3 py-2 rounded-lg transition-all"
                style={{ background: "var(--card-bg)", color: "var(--muted-fg)", border: "1px solid var(--card-border)" }}>
                ↓ {t("exportJson") !== "exportJson" ? t("exportJson") : "Export JSON"}
              </button>
              <button onClick={handlePrintPdf} className="text-xs px-3 py-2 rounded-lg font-medium transition-all"
                style={{ background: "var(--accent)", color: "#0a0a0a" }}>
                {t("printDeck")}
              </button>
            </div>
          </div>

          {/* Navigation Tabs: Pitch Deck vs Reports Hub */}
          <div className="flex gap-2 border-b" style={{ borderColor: "var(--card-border)" }}>
            <button onClick={() => setActiveTab("deck")}
              className={`pb-3 text-sm font-semibold border-b-2 px-1 transition-all ${activeTab === "deck" ? "border-[#daf264] text-white" : "border-transparent text-[#666] hover:text-white"}`}>
              {t("pitchDeckSimulator") !== "pitchDeckSimulator" ? t("pitchDeckSimulator") : "Pitch Deck Simulator"}
            </button>
            <button onClick={() => setActiveTab("reports")}
              className={`pb-3 text-sm font-semibold border-b-2 px-1 transition-all ${activeTab === "reports" ? "border-[#daf264] text-white" : "border-transparent text-[#666] hover:text-white"}`}>
              {t("documentHub") !== "documentHub" ? t("documentHub") : "Document Intelligence Hub"}
            </button>
          </div>

          {/* TAB 1: PITCH DECK SIMULATOR */}
          {activeTab === "deck" && (
            <div className="space-y-6">
              {/* Theme Settings Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl gap-4"
                style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {t("designTheme") !== "designTheme" ? t("designTheme") : "DESIGN MODE THEME"}:
                </span>
                <div className="flex flex-wrap gap-1">
                  {(Object.keys(styleMap) as Array<keyof typeof styleMap>).map((mode) => (
                    <button key={mode} onClick={() => setStyleMode(mode)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${styleMode === mode ? "bg-[#daf264] text-[#0a0a0a]" : "bg-black/40 text-gray-400 hover:text-white border border-[#222]"}`}>
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Deck Workspace */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Thumbnails Sidebar */}
                <div className="space-y-1.5 overflow-y-auto pr-2" style={{ maxHeight: 580 }}>
                  {dynamicSlides.map((s: any, i: number) => (
                    <button key={s?.slideNumber || i} onClick={() => setActiveSlideIdx(i)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
                      style={{
                        background: activeSlideIdx === i ? "rgba(218, 242, 100, 0.08)" : "var(--card-bg)",
                        border: activeSlideIdx === i ? "1px solid rgba(218, 242, 100, 0.3)" : "1px solid var(--card-border)",
                      }}>
                      <span className="text-base w-5 flex-shrink-0" style={{ color: activeSlideIdx === i ? "var(--accent)" : "#555" }}>
                        {getIcon(s?.slideNumber || (i + 1), s?.title || "")}
                      </span>
                      <span className="text-xs font-medium" style={{ color: activeSlideIdx === i ? "white" : "#888" }}>
                        {s?.slideNumber || (i + 1)}. {s?.title || `Slide ${i + 1}`}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Presentation Preview Card */}
                <div className="lg:col-span-3 flex flex-col justify-between rounded-2xl overflow-hidden shadow-2xl transition-all"
                  style={{ background: "#060606", border: "1px solid #1a1a1a", minHeight: 480 }}>
                  
                  {/* Top Slide Bar */}
                  <div className={`flex items-center justify-between px-6 py-4 border-b ${activeTheme.borderColor}`}>
                    <div className="flex items-center gap-2">
                      <span className={`text-base ${activeTheme.accentText}`}>
                        {getIcon(slide.slideNumber, slide.title)}
                      </span>
                      <span className={`text-xs font-bold uppercase tracking-wider ${activeTheme.textColor}`}>
                        {slide.title}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 font-medium">
                      {t("slide")} {slide.slideNumber} / {dynamicSlides.length}
                    </span>
                  </div>

                  {/* Dynamic Custom-Theme Content Block */}
                  <AnimatePresence mode="wait">
                    <motion.div key={slide.slideNumber}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className={`p-12 flex flex-col justify-center flex-1 ${activeTheme.bg} ${activeTheme.font}`}>
                      
                      <h2 className={`text-3xl font-extrabold mb-8 tracking-tight ${activeTheme.textColor}`}>
                        {slide.headline}
                      </h2>

                      {/* Render Lists */}
                      {slide && Array.isArray(slide.points) && slide.points.length > 0 && (
                        <ul className="space-y-4">
                          {slide.points.map((p: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-3">
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5 ${activeTheme.themeBadge}`}>
                                ✓
                              </span>
                              <span className="text-sm text-gray-300 leading-relaxed">{p}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Render Stats Grid */}
                      {slide && Array.isArray(slide.stats) && slide.stats.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-4">
                          {slide.stats.map((st: any, idx: number) => (
                            <div key={idx} className={`text-center p-6 rounded-2xl border ${activeTheme.borderColor}`}
                              style={{ background: "rgba(255,255,255,0.01)" }}>
                              <p className={`text-4xl font-extrabold ${activeTheme.accentText}`}>{st?.value || ''}</p>
                              <p className="text-xs mt-2 text-gray-400 font-semibold tracking-wider uppercase">{st?.label || ''}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Render Business Pricing Models */}
                      {slide && Array.isArray(slide.models) && slide.models.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                          {slide.models.map((m: any, idx: number) => (
                            <div key={idx} className={`rounded-xl p-5 border ${activeTheme.borderColor}`}
                              style={{ background: "rgba(255,255,255,0.02)" }}>
                              <p className={`text-xs font-bold mb-2 uppercase tracking-wide ${activeTheme.accentText}`}>{m?.type || ''}</p>
                              <p className={`text-2xl font-black ${activeTheme.textColor}`}>{m?.price || ''}</p>
                              <p className="text-xs mt-1 text-gray-400">{m?.note || ''}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Render Team Members */}
                      {slide && Array.isArray(slide.members) && slide.members.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                          {slide.members.map((m: any, idx: number) => (
                            <div key={idx} className="text-center">
                              <div className={`w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center text-2xl font-bold border ${activeTheme.borderColor}`}
                                style={{ background: `${activeTheme.accentColor}10`, color: activeTheme.accentColor }}>
                                {m?.name ? m.name[0] : '?'}
                              </div>
                              <p className={`text-sm font-bold ${activeTheme.textColor}`}>{m?.name || ''}</p>
                              <p className="text-xs mt-1 text-gray-400">{m?.bg || ''}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>

                  {/* Navigation Footer */}
                  <div className={`flex items-center justify-between px-6 py-4 border-t ${activeTheme.borderColor}`}>
                    <button onClick={() => setActiveSlideIdx(Math.max(0, activeSlideIdx - 1))}
                      disabled={activeSlideIdx === 0}
                      className="text-xs px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-20"
                      style={{ background: "#121212", color: "#888", border: "1px solid #222" }}>
                      ← {t("back") !== "back" ? t("back") : "Back"}
                    </button>
                    
                    <div className="flex gap-1.5">
                      {dynamicSlides.map((_: any, i: number) => (
                        <button key={i} onClick={() => setActiveSlideIdx(i)}
                          className="w-1.5 h-1.5 rounded-full transition-all"
                          style={{ background: i === activeSlideIdx ? activeTheme.accentColor : "#222" }} />
                      ))}
                    </div>

                    <button onClick={() => setActiveSlideIdx(Math.min(dynamicSlides.length - 1, activeSlideIdx + 1))}
                      disabled={activeSlideIdx === dynamicSlides.length - 1}
                      className={`text-xs px-4 py-2 rounded-lg font-bold transition-all disabled:opacity-20 ${activeTheme.btnPrimary}`}>
                      {t("next") !== "next" ? t("next") : "Next"} →
                    </button>
                  </div>
                </div>
              </div>

              {/* Single Slide Print PDF instructions */}
              <div className="p-4 rounded-xl flex items-center justify-between"
                style={{ background: "rgba(218,242,100,0.02)", border: "1px dashed rgba(218,242,100,0.1)" }}>
                <div className="flex items-center gap-3">
                  <span className="text-lg">🖨️</span>
                  <div>
                    <p className="text-xs font-semibold text-white">{t("pdfExportDescTitle") !== "pdfExportDescTitle" ? t("pdfExportDescTitle") : "Full Slide deck vector export"}</p>
                    <p className="text-[11px] text-gray-400">{t("pdfExportDesc") !== "pdfExportDesc" ? t("pdfExportDesc") : "Click \"Print PDF\" at the top of the page. The system formats each slide onto a fresh page automatically."}</p>
                  </div>
                </div>
                <button onClick={() => ExportService.downloadTextFile("pitch_deck.md", ExportService.slidesToMarkdown(dynamicSlides))}
                  className="text-xs px-3 py-1.5 bg-black/40 border border-[#222] text-gray-400 hover:text-white rounded-lg">
                  {t("exportDeckAsMd") !== "exportDeckAsMd" ? t("exportDeckAsMd") : "Export Deck as MD"}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: DOCUMENT INTELLIGENCE HUB */}
          {activeTab === "reports" && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Report selection sidebar */}
              <div className="space-y-2">
                {reportsMeta.map((rm) => (
                  <button key={rm.key} onClick={() => setActiveReportKey(rm.key)}
                    className="w-full text-left p-3.5 rounded-xl border transition-all flex flex-col gap-1"
                    style={{
                      background: activeReportKey === rm.key ? "rgba(218,242,100,0.06)" : "var(--card-bg)",
                      borderColor: activeReportKey === rm.key ? "rgba(218,242,100,0.25)" : "var(--card-border)"
                    }}>
                    <span className="text-xs font-bold text-white">
                      {rm.label}
                    </span>
                    <span className="text-[10px] text-gray-400 leading-snug">
                      {rm.desc}
                    </span>
                  </button>
                ))}
              </div>

              {/* Document rendering sheet */}
              <div className="lg:col-span-3 rounded-2xl flex flex-col justify-between"
                style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", minHeight: 520 }}>
                
                {/* Sheet actions */}
                <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--card-border)" }}>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    {currentReport.label}
                  </h3>
                  <div className="flex gap-2">
                    <button onClick={() => handleExportMarkdown(currentReport.key, currentReport.data)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-[#222] bg-black/40 text-gray-400 hover:text-white">
                      ↓ MD
                    </button>
                    <button onClick={() => handleExportHtml(currentReport.key, currentReport.data)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-[#222] bg-black/40 text-gray-400 hover:text-white">
                      ↓ HTML
                    </button>
                  </div>
                </div>

                {/* Styled document view */}
                <div className="p-8 overflow-y-auto max-h-[500px] prose prose-invert max-w-none text-sm text-gray-300 space-y-6">
                  <h1 className="text-2xl font-bold text-[#daf264] border-b border-[#daf264]/20 pb-2">
                    {currentReport.data.title || currentReport.label}
                  </h1>

                  {/* Opportunity Analysis report layout */}
                  {currentReport.key === "opportunityAnalysis" && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-800" style={{ background: "rgba(255,255,255,0.01)" }}>
                        <div className="text-4xl font-extrabold text-[#daf264]">
                          {currentReport.data.overallScore}%
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{t("opportunityRating") !== "opportunityRating" ? t("opportunityRating") : "Venture Opportunity Rating"}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{t("opportunityRatingDesc") !== "opportunityRatingDesc" ? t("opportunityRatingDesc") : "Calculated weighting of all structural validation agents."}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-white">Score Breakdown</h4>
                        <div className="grid grid-cols-2 gap-4">
                          {Object.entries(currentReport.data.breakdown || {}).map(([bk, bv]: any) => (
                            <div key={bk} className="p-3 bg-black/40 border border-gray-800 rounded-lg">
                              <p className="text-[10px] uppercase font-semibold text-gray-500">{bk.replace(/([A-Z])/g, " $1")}</p>
                              <p className="text-sm font-bold text-white mt-1">{bv}/100</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-white">{t("scoreBreakdown") !== "scoreBreakdown" ? t("scoreBreakdown") : "Score Breakdown"}</h4>
                        <ul className="list-disc pl-5 space-y-2 text-xs text-gray-300">
                          {(currentReport.data.keyFindings || []).map((f: string, idx: number) => (
                            <li key={idx}>{f}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* One-Page Brief layout */}
                  {currentReport.key === "onePageBrief" && (
                    <div className="space-y-6">
                      <div className="p-4 rounded-xl border border-gray-800 bg-black/20 text-xs italic leading-relaxed text-gray-300">
                        {currentReport.data.summary}
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-white">{t("criticalMetrics") !== "criticalMetrics" ? t("criticalMetrics") : "Critical Metrics"}</h4>
                        <div className="grid grid-cols-3 gap-4">
                          {(currentReport.data.keyMetrics || []).map((m: any, idx: number) => (
                            <div key={idx} className="p-3 bg-black/40 border border-gray-800 rounded-lg text-center">
                              <p className="text-[10px] uppercase font-semibold text-gray-500">{m.label}</p>
                              <p className="text-sm font-bold text-[#daf264] mt-1">{m.value}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-white">{t("recommendedActions") !== "recommendedActions" ? t("recommendedActions") : "Immediate Recommended Actions"}</h4>
                        <ul className="list-disc pl-5 space-y-2 text-xs text-gray-300">
                          {(currentReport.data.recommendedActions || []).map((a: string, idx: number) => (
                            <li key={idx}>{a}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Standard Structured Reports layout */}
                  {currentReport.key !== "opportunityAnalysis" && currentReport.key !== "onePageBrief" && (
                    <div className="space-y-6">
                      {Object.entries(currentReport.data.sections || {}).map(([secKey, secValue]: any) => (
                        <div key={secKey} className="space-y-2 border-l-2 border-gray-800 pl-4 py-1">
                          <h4 className="text-xs font-bold uppercase tracking-widest text-[#daf264]">
                            {secKey.replace(/([A-Z])/g, " $1")}
                          </h4>
                          {Array.isArray(secValue) ? (
                            <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-300">
                              {secValue.map((item: string, idx: number) => (
                                <li key={idx} className="leading-relaxed">{item}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs leading-relaxed text-gray-300">{secValue}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="px-6 py-4 border-t text-[11px] text-gray-500 flex items-center justify-between"
                  style={{ borderColor: "var(--card-border)" }}>
                  <span>{t("generatedDynamically") !== "generatedDynamically" ? t("generatedDynamically") : "Generated dynamically by VentureIQ strategic consultant network."}</span>
                  <span>{t("dataFidelity") !== "dataFidelity" ? t("dataFidelity") : "100% data fidelity."}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* PRINT AREA CONTAINER (HIDDEN ON SCREEN, VISIBLE ON PRINT) */}
        <div id="print-area" className="hidden">
          {dynamicSlides.map((s: any) => (
            <div key={s.slideNumber} className="print-page-break">
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #333", paddingBottom: "8px", marginBottom: "30px" }}>
                <span style={{ fontSize: "12px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px" }}>
                  {s.title}
                </span>
                <span style={{ fontSize: "12px", color: "#888" }}>
                  Slide {s.slideNumber} / 12
                </span>
              </div>
              
              <h2 style={{ fontSize: "32px", fontWeight: "800", marginBottom: "40px", lineHeight: "1.2", letterSpacing: "-0.5px" }}>
                {s.headline}
              </h2>

              {s && Array.isArray(s.points) && s.points.length > 0 && (
                <ul style={{ listStyleType: "none", padding: 0, margin: 0 }}>
                  {s.points.map((p: string, idx: number) => (
                    <li key={idx} style={{ fontSize: "16px", marginBottom: "16px", display: "flex", alignItems: "flex-start" }}>
                      <span style={{ marginRight: "12px", color: "#daf264" }}>✓</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              )}

              {s && Array.isArray(s.stats) && s.stats.length > 0 && (
                <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
                  {s.stats.map((st: any, idx: number) => (
                    <div key={idx} style={{ flex: 1, textAlign: "center", padding: "20px", border: "1px solid #333", borderRadius: "8px" }}>
                      <p style={{ fontSize: "36px", fontWeight: "800", color: "#daf264", margin: 0 }}>{st?.value || ''}</p>
                      <p style={{ fontSize: "12px", color: "#aaa", textTransform: "uppercase", marginTop: "8px", letterSpacing: "0.5px" }}>{st?.label || ''}</p>
                    </div>
                  ))}
                </div>
              )}

              {s && Array.isArray(s.models) && s.models.length > 0 && (
                <div style={{ display: "flex", gap: "15px", marginTop: "20px" }}>
                  {s.models.map((m: any, idx: number) => (
                    <div key={idx} style={{ flex: 1, padding: "15px", border: "1px solid #333", borderRadius: "8px" }}>
                      <p style={{ fontSize: "11px", fontWeight: "bold", color: "#daf264", margin: "0 0 6px 0", textTransform: "uppercase" }}>{m?.type || ''}</p>
                      <p style={{ fontSize: "20px", fontWeight: "900", margin: 0 }}>{m?.price || ''}</p>
                      <p style={{ fontSize: "11px", color: "#888", marginTop: "4px", margin: 0 }}>{m?.note || ''}</p>
                    </div>
                  ))}
                </div>
              )}

              {s && Array.isArray(s.members) && s.members.length > 0 && (
                <div style={{ display: "flex", gap: "30px", marginTop: "20px" }}>
                  {s.members.map((m: any, idx: number) => (
                    <div key={idx} style={{ textAlign: "center" }}>
                      <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "#222", border: "1px solid #444", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: "bold", margin: "0 auto 10px auto", color: "#daf264" }}>
                        {m?.name ? m.name[0] : '?'}
                      </div>
                      <p style={{ fontSize: "14px", fontWeight: "bold", margin: 0 }}>{m?.name || ''}</p>
                      <p style={{ fontSize: "12px", color: "#888", marginTop: "2px" }}>{m?.bg || ''}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        </PremiumGate>
      </DashboardLayout>
    </ProjectGuard>
  );
}
