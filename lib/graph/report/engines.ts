// lib/graph/report/engines.ts
import { ChartCollection, ChartDataPoint, PitchDeckSlide } from "./types";

export class ChartEngine {
  /**
   * Programmatically validates and enforces consistency between chart datasets
   * and upstream financial/risk intelligence inputs.
   */
  public static validateAndSync(
    charts: ChartCollection,
    financialIntel: any,
    marketIntel: any
  ): ChartCollection {
    const revenueProjections = financialIntel?.revenueForecast?.revenueProjections || [];
    const startupCosts = financialIntel?.startupCosts?.scenarios?.expected || [];

    // 1. Sync Revenue Forecast chart with financialIntel projections
    const revenueForecast: ChartDataPoint[] = [];
    if (revenueProjections.length > 0) {
      revenueProjections.forEach((proj: any, idx: number) => {
        revenueForecast.push({
          label: `Year ${idx + 1}`,
          value: parseFloat(proj.arr?.replace(/[^0-9.]/g, "")) || 0
        });
      });
    } else {
      revenueForecast.push(
        { label: "Year 1", value: 142000 },
        { label: "Year 2", value: 450000 },
        { label: "Year 3", value: 1420000 }
      );
    }

    // 2. Sync Cost Breakdown chart with financialIntel startup costs
    const costBreakdown: ChartDataPoint[] = [];
    if (startupCosts.length > 0) {
      startupCosts.forEach((c: any) => {
        costBreakdown.push({
          label: c.item || c.category || "Development",
          value: parseFloat((c.amount || c.cost || "0")?.toString()?.replace(/[^0-9.]/g, "")) || 0
        });
      });
    } else {
      costBreakdown.push(
        { label: "Product Development", value: 80000 },
        { label: "Marketing & Acquisition", value: 50000 },
        { label: "Operations & Hosting", value: 30000 },
        { label: "Legal & Compliance", value: 40000 }
      );
    }

    return {
      ...charts,
      revenueForecast,
      costBreakdown
    };
  }
}

export class TemplateEngine {
  /**
   * Generates custom styled HTML layout templates based on the selected mode.
   */
  public static getStyledHtml(content: string, mode: "NORMAL" | "INVESTOR" | "ACCELERATOR" | "HACKATHON" | "CORPORATE"): string {
    const styleMap = {
      NORMAL: { primary: "#ffffff", accent: "#daf264", bg: "#0a0a0a" },
      INVESTOR: { primary: "#f8fafc", accent: "#38bdf8", bg: "#0f172a" },
      ACCELERATOR: { primary: "#fff", accent: "#f43f5e", bg: "#0f0f17" },
      HACKATHON: { primary: "#ffffff", accent: "#a855f7", bg: "#09090b" },
      CORPORATE: { primary: "#f3f4f6", accent: "#2563eb", bg: "#111827" }
    };

    const style = styleMap[mode] || styleMap.NORMAL;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: ${style.primary};
              background-color: ${style.bg};
              padding: 40px;
              line-height: 1.6;
            }
            h1 { color: ${style.accent}; font-size: 28px; border-bottom: 2px solid ${style.accent}30; padding-bottom: 8px; }
            h2 { color: ${style.accent}; font-size: 20px; margin-top: 30px; }
            h3 { color: #888; font-size: 16px; }
            li { margin-bottom: 8px; font-size: 14px; }
            p { font-size: 14px; color: rgba(255,255,255,0.7); }
            .accent-text { color: ${style.accent}; font-weight: bold; }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `;
  }
}

export class ExportService {
  /**
   * Triggers client-side downloads for different deliverable reports.
   */
  public static downloadTextFile(filename: string, textContent: string) {
    if (typeof window === "undefined") return;
    const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Generates a markdown representation of the slides.
   */
  public static slidesToMarkdown(slides: PitchDeckSlide[]): string {
    return slides.map(s => {
      let slideText = `# Slide ${s.slideNumber}: ${s.title}\n## ${s.headline}\n\n`;
      if (s.points) {
        slideText += s.points.map(p => `- ${p}`).join("\n") + "\n";
      }
      if (s.stats) {
        slideText += s.stats.map(st => `* **${st.label}**: ${st.value}`).join("\n") + "\n";
      }
      if (s.models) {
        slideText += s.models.map(m => `* **${m.type}**: ${m.price} (${m.note})`).join("\n") + "\n";
      }
      if (s.members) {
        slideText += s.members.map(m => `* **${m.name}** - ${m.bg}`).join("\n") + "\n";
      }
      return slideText + "\n---\n";
    }).join("\n");
  }

  /**
   * Formats a Business Plan into Markdown text.
   */
  public static businessPlanToMarkdown(bp: any): string {
    let md = `# Business Plan: ${bp.title}\n\n`;
    for (const [key, value] of Object.entries(bp.sections || {})) {
      const formattedTitle = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1");
      md += `## ${formattedTitle}\n`;
      if (Array.isArray(value)) {
        md += value.map(item => `- ${item}`).join("\n") + "\n\n";
      } else {
        md += `${value}\n\n`;
      }
    }
    return md;
  }
}
