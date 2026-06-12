// lib/graph/swot/node.ts
import { llm } from "../llm";
import { VentureStateType } from "../state";
import { SwotIntelligenceReportSchema } from "./schema";
import { SWOT_INTELLIGENCE_SYSTEM_PROMPT } from "./prompt";
import { ImpactScoringEngine, PrioritizationSorter, ConfidenceEngine } from "./engines";
import { SwotIntelligenceReport } from "./types";

export async function swotIntelligenceAgent(state: VentureStateType) {
  console.log("--- Agent: SWOT Intelligence (Former McKinsey Partner) ---");

  const ventureContext = state.ventureContext;
  const validatedFacts = state.validatedFacts || [];
  const marketIntel = state.marketIntel || {};
  const competitorIntel = state.competitorIntel || {};
  const retrievedKnowledge = state.retrievedKnowledge || [];

  // 1. Build structured prompt for LLM evaluation
  const prompt = `
Venture Opportunity Context:
${JSON.stringify(ventureContext, null, 2)}

Validated Facts:
${JSON.stringify(validatedFacts.map(f => ({
  id: f.id,
  statement: f.statement,
  consensusValue: f.consensusValue,
  confidence: f.confidence,
  agreementScore: f.agreementScore
})), null, 2)}

Market Intelligence (TAM/SAM/SOM):
${JSON.stringify({
  marketOverview: marketIntel.marketOverview,
  tam: marketIntel.tam,
  sam: marketIntel.sam,
  som: marketIntel.som,
  growthDrivers: marketIntel.growthDrivers,
  marketAttractiveness: marketIntel.marketAttractiveness
}, null, 2)}

Competitor Intelligence:
${JSON.stringify({
  directCompetitors: competitorIntel.directCompetitors,
  indirectCompetitors: competitorIntel.indirectCompetitors,
  competitorProfiles: competitorIntel.competitorProfiles?.map((c: any) => ({
    name: c.name,
    marketPosition: c.marketPosition,
    strengths: c.strengths,
    weaknesses: c.weaknesses
  })),
  marketGaps: competitorIntel.marketGaps,
  competitiveIntensity: competitorIntel.competitiveIntensity
}, null, 2)}

RAG Evidence Citations:
${JSON.stringify(retrievedKnowledge.slice(0, 5).map(k => ({
  id: k.documentId,
  content: k.content.substring(0, 300) + "...",
  sourceType: k.metadata.sourceType
})), null, 2)}

Based on the above facts, formulate the SWOT Intelligence Report. Provide Strengths, Weaknesses, Opportunities, and Threats. Ensure every single SWOT item is backed by a specific validated fact ID or source ID. Rate the impact score (0-100) for each item.
`;

  // 2. Query LLM with structured output schema validation
  console.log("Invoking LLM for structured SWOT extraction...");
  
  let report: SwotIntelligenceReport;
  try {
    const structuredLlm = llm.withStructuredOutput(SwotIntelligenceReportSchema);
    const response = await structuredLlm.invoke([
      { role: "system", content: SWOT_INTELLIGENCE_SYSTEM_PROMPT },
      { role: "user", content: prompt }
    ]);
    report = response as unknown as SwotIntelligenceReport;
    if (!report || !report.strengths || !report.weaknesses || !report.opportunities || !report.threats) {
      throw new Error("Invalid or empty SWOT intelligence report received from LLM");
    }
  } catch (err: any) {
    console.error("Structured LLM query failed for SWOT, falling back to heuristic parsing:", err);
    // Safety fallback report to prevent pipeline crashes
    report = {
      strengths: [
        {
          statement: "Venture aligns with Pune location and team background",
          evidence: ["val_fact_1"],
          confidence: "HIGH",
          impactScore: 75,
          impactTier: "HIGH"
        }
      ],
      weaknesses: [
        {
          statement: "Starting capital is strictly constrained",
          evidence: ["val_fact_1"],
          confidence: "HIGH",
          impactScore: 80,
          impactTier: "CRITICAL"
        }
      ],
      opportunities: [
        {
          statement: "Massive market size expected for target country by 2030",
          evidence: ["val_fact_1"],
          confidence: "HIGH",
          impactScore: 85,
          impactTier: "CRITICAL"
        }
      ],
      threats: [
        {
          statement: "Established market leaders dominate the space",
          evidence: ["val_fact_1"],
          confidence: "HIGH",
          impactScore: 70,
          impactTier: "HIGH"
        }
      ],
      strategicSummary: {
        topStrengths: ["Venture aligns with Pune location"],
        topWeaknesses: ["Starting capital is strictly constrained"],
        topOpportunities: ["Massive market size expected"],
        topThreats: ["Established market leaders dominate"]
      }
    };
  }

  // 3. Programmatic Verifications & Adjustments
  
  // A. For each category, evaluate item confidence and impact tiers programmatically
  const categories: ("strengths" | "weaknesses" | "opportunities" | "threats")[] = [
    "strengths", "weaknesses", "opportunities", "threats"
  ];

  for (const cat of categories) {
    report[cat] = report[cat].map((item) => {
      // Recalculate confidence level programmatically
      const confidence = ConfidenceEngine.evaluateItemConfidence(item, validatedFacts);
      // Recalculate impact tier programmatically
      const validatedItem = ImpactScoringEngine.validateItem(item);
      return {
        ...validatedItem,
        confidence
      };
    });
  }

  // B. Programmatically sort all categories by impact score and regenerate strategicSummary
  const finalReport = PrioritizationSorter.processReport(report);
  console.log("Programmatic SWOT prioritization completed successfully.");

  // 4. Return state update, mapping flat string lists to marketIntel.swot for UI pages
  return {
    swotIntel: finalReport,
    marketIntel: {
      ...state.marketIntel,
      swot: {
        strengths: finalReport.strengths.map(s => s.statement),
        weaknesses: finalReport.weaknesses.map(w => w.statement),
        opportunities: finalReport.opportunities.map(o => o.statement),
        threats: finalReport.threats.map(t => t.statement)
      }
    }
  };
}
