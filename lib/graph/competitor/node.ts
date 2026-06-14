// lib/graph/competitor/node.ts
import { llm } from "../llm";
import { VentureStateType } from "../state";
import { CompetitorIntelligenceReportSchema } from "./schema";
import { COMPETITOR_INTELLIGENCE_SYSTEM_PROMPT } from "./prompt";
import { CompetitiveIntensityEngine, CompetitorConfidenceEngine } from "./engines";
import { CompetitorIntelligenceReport } from "./types";

export async function competitorIntelligenceAgent(state: VentureStateType) {
  console.log("--- Agent: Competitor Intelligence ---");

  const ventureContext = state.ventureContext;
  const retrievedKnowledge = state.retrievedKnowledge || [];
  const validatedFacts = state.validatedFacts || [];
  const entities = state.entities || [];
  const relationships = state.relationships || [];
  const reliability = state.reliability || {
    overallReliability: 70,
    marketReliability: 70,
    competitionReliability: 70,
    financialReliability: 70,
    regulationReliability: 70
  };
  const marketIntel = state.marketIntel || {};

  // 1. Build structured prompt for LLM evaluation
  const prompt = `
Venture Opportunity Context:
${JSON.stringify(ventureContext, null, 2)}

Retrieved Verified Knowledge (RAG):
${JSON.stringify(retrievedKnowledge.map(k => ({
  id: k.documentId,
  content: k.content,
  category: k.metadata.category,
  publishDate: k.metadata.publishDate,
  sourceType: k.metadata.sourceType,
  credibilityScore: k.credibilityScore
})), null, 2)}

Validated Facts:
${JSON.stringify(validatedFacts.map(f => ({
  id: f.id,
  statement: f.statement,
  consensusValue: f.consensusValue,
  confidence: f.confidence,
  credibilityScore: f.credibilityScore
})), null, 2)}

Entities Extracted:
${JSON.stringify(entities.map(e => ({ name: e.name, type: e.type })), null, 2)}

Relationships Extracted:
${JSON.stringify(relationships.map(r => ({ source: r.sourceEntityId, relation: r.relationType, target: r.targetEntityId })), null, 2)}

Market Intelligence (TAM/SAM/SOM):
${JSON.stringify({
  marketOverview: marketIntel.marketOverview,
  tam: marketIntel.tam,
  sam: marketIntel.sam,
  som: marketIntel.som
}, null, 2)}

Based on the above facts, formulate the Competitor Intelligence Report. Categorize direct and indirect competitors, profile each competitor, build the feature matrix comparisons, price analysis, positioning coordinates, gaps, and differentiation opportunities. Do not fabricate.
`;

  // 2. Query LLM with structured output schema validation
  console.log("Invoking LLM for structured competitor intelligence extraction...");
  
  let report: CompetitorIntelligenceReport;
  try {
    const structuredLlm = llm.withStructuredOutput(CompetitorIntelligenceReportSchema);
    const response = await structuredLlm.invoke([
      { role: "system", content: COMPETITOR_INTELLIGENCE_SYSTEM_PROMPT },
      { role: "user", content: prompt }
    ]);
    report = response as unknown as CompetitorIntelligenceReport;
    if (!report || !report.competitorProfiles || !report.featureMatrix || !report.competitiveIntensity) {
      throw new Error("Invalid or empty competitor intelligence report received from LLM");
    }
  } catch (err: any) {
    console.error("Structured LLM query failed for Competitor Intelligence, returning empty report:", err);
    report = {
      directCompetitors: [],
      indirectCompetitors: [],
      competitorProfiles: [],
      featureMatrix: {
        features: [],
        comparisons: []
      },
      pricingAnalysis: {
        pricingModels: [],
        segments: []
      },
      positioningAnalysis: {
        positioningMap: [],
        strategicPosition: "Missing competitor intelligence data."
      },
      marketGaps: [],
      moatOpportunities: [],
      differentiationOpportunities: [],
      competitiveIntensity: {
        score: 0,
        factors: [],
        reasoning: ["Missing competitor data."]
      },
      confidence: {
        overallConfidence: "LOW",
        supportingSources: [],
        evidenceCount: 0,
        reasoning: "Heuristic fallback report utilized"
      }
    };
  }

  // 3. Programmatic Verifications & Adjustments
  
  // A. Calculate Competitive Intensity Score programmatically
  const intensityResults = CompetitiveIntensityEngine.computeScore(report.competitiveIntensity.factors);
  report.competitiveIntensity.score = intensityResults.score;
  report.competitiveIntensity.factors = intensityResults.normalizedFactors;
  console.log(`Programmatically verified Competitor Intensity Score: ${report.competitiveIntensity.score}/100`);

  // B. Calculate Competitor Confidence programmatically
  const confidenceResults = CompetitorConfidenceEngine.evaluate(
    retrievedKnowledge,
    validatedFacts,
    report.competitorProfiles,
    reliability.overallReliability
  );
  report.confidence = confidenceResults;
  console.log(`Programmatically verified Competitor Confidence: ${report.confidence.overallConfidence}`);

  // 4. Return state update, writing competitor report into both competitorIntel and marketIntel.competitors
  return {
    competitorIntel: report,
    marketIntel: {
      ...state.marketIntel,
      competitors: report
    }
  };
}
