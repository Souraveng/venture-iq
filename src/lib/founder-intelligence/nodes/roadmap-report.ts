// ──────────────────────────────────────────────────────────────────────────────
// Phase 5c — Roadmap & Report Generator
// Model: 🟣 GLM-5.2 (sustained agentic session, strict output schema)
// Generates 7-tab dashboard JSON + roadmap milestones in one call
// ──────────────────────────────────────────────────────────────────────────────

import { vertexAiCallJSON } from "../model-router";
import { loadPrompt } from "../utils/prompt-loader";
import type { RoadmapReport, PipelineNodeId } from "../contracts";

const GUIDED_SCHEMA = {
  type: "object",
  properties: {
    elevatorPitch: { type: "string" },
    roadmapMilestones: {
      type: "array",
      items: {
        type: "object",
        properties: {
          month: { type: "string" },
          milestone: { type: "string" },
        },
        required: ["month", "milestone"],
      },
      minItems: 3,
      maxItems: 6,
    },
    dashboardTabs: {
      type: "object",
      properties: {
        research:    { type: "object", properties: { engine: { type: "string" }, title: { type: "string" }, summary: { type: "string" }, dataPoints: { type: "array", items: { type: "string" } } }, required: ["engine", "title", "summary", "dataPoints"] },
        competitors: { type: "object", properties: { engine: { type: "string" }, title: { type: "string" }, summary: { type: "string" }, dataPoints: { type: "array", items: { type: "string" } } }, required: ["engine", "title", "summary", "dataPoints"] },
        risks:       { type: "object", properties: { engine: { type: "string" }, title: { type: "string" }, summary: { type: "string" }, dataPoints: { type: "array", items: { type: "string" } } }, required: ["engine", "title", "summary", "dataPoints"] },
        financials:  { type: "object", properties: { engine: { type: "string" }, title: { type: "string" }, summary: { type: "string" }, dataPoints: { type: "array", items: { type: "string" } } }, required: ["engine", "title", "summary", "dataPoints"] },
        pitch:       { type: "object", properties: { engine: { type: "string" }, title: { type: "string" }, summary: { type: "string" }, dataPoints: { type: "array", items: { type: "string" } } }, required: ["engine", "title", "summary", "dataPoints"] },
        roadmap:     { type: "object", properties: { engine: { type: "string" }, title: { type: "string" }, summary: { type: "string" }, dataPoints: { type: "array", items: { type: "string" } } }, required: ["engine", "title", "summary", "dataPoints"] },
        validation:  { type: "object", properties: { engine: { type: "string" }, title: { type: "string" }, summary: { type: "string" }, dataPoints: { type: "array", items: { type: "string" } } }, required: ["engine", "title", "summary", "dataPoints"] },
      },
      required: ["research", "competitors", "risks", "financials", "pitch", "roadmap", "validation"],
    },
  },
  required: ["elevatorPitch", "roadmapMilestones", "dashboardTabs"],
};

export async function runRoadmapReport(state: any) {
  const idea = state.input?.idea || "";
  const p = state.pipeline || {};

  const contextParts = [
    `Startup: ${idea}`,
    `Sector: ${p.playbook?.sector || "general"}, Geography: ${p.playbook?.geography || "global"}`,
    `Problem: ${p.opportunity?.problemStatement || idea}`,
    `Customer: ${p.opportunity?.targetCustomer || "N/A"}`,
    `Value Prop: ${p.opportunity?.valueProposition || "N/A"}`,
    `Monetization: ${p.opportunity?.monetizationModel || "N/A"}`,
    ``,
    `Market Score: ${p.marketAnalysis?.marketScore || "N/A"}/100 — ${p.marketAnalysis?.marketSummary || ""}`,
    `TAM: ${p.marketAnalysis?.tamEstimate || "N/A"}, SAM: ${p.marketAnalysis?.samEstimate || "N/A"}`,
    `Competitors: ${p.marketAnalysis?.competitors?.map((c: any) => `${c.name} (strength: ${c.strength}, weakness: ${c.weakness})`).join("; ") || "N/A"}`,
    ``,
    `Risk Score: ${p.riskAnalysis?.riskScore || "N/A"}/100`,
    `SWOT-S: ${p.riskAnalysis?.swot?.strengths?.join("; ") || "N/A"}`,
    `SWOT-W: ${p.riskAnalysis?.swot?.weaknesses?.join("; ") || "N/A"}`,
    `SWOT-O: ${p.riskAnalysis?.swot?.opportunities?.join("; ") || "N/A"}`,
    `SWOT-T: ${p.riskAnalysis?.swot?.threats?.join("; ") || "N/A"}`,
    `Risks: ${p.riskAnalysis?.risks?.map((r: any) => `${r.category}(${r.severity}): ${r.description}`).join("; ") || "N/A"}`,
    ``,
    `Financial Score: ${p.financialAnalysis?.financialScore || "N/A"}/100`,
    `Narrative: ${p.financialAnalysis?.narrative || "N/A"}`,
    `LTV/CAC: ${p.financialAnalysis?.calculations?.ltvCacRatio || "N/A"}x, Runway: ${p.financialAnalysis?.calculations?.runwayMonths || "N/A"} months`,
    ``,
    `Decision: Grade ${p.scorecard?.grade || "N/A"} (${p.scorecard?.overallScore || "N/A"}/100)`,
    `Explanation: ${p.scorecard?.explanation || "N/A"}`,
    ``,
    `Executive Summary: ${p.synthesis?.executiveSummary || "N/A"}`,
    `Investment Thesis: ${p.synthesis?.investmentThesis || "N/A"}`,
    `Key Insights: ${p.synthesis?.keyInsights?.join("; ") || "N/A"}`,
  ];

  const report = await vertexAiCallJSON<RoadmapReport>({
    model: "roadmap",
    messages: [
      { role: "system", content: loadPrompt("roadmap-report") },
      { role: "user", content: contextParts.join("\n") },
    ],
    guidedJson: GUIDED_SCHEMA,
    maxTokens: 3000,
  });

  return {
    pipeline: {
      report,
      completedNodes: ["roadmap-report"] as PipelineNodeId[],
    },
  };
}
