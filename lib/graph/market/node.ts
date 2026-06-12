// lib/graph/market/node.ts
import { llm } from "../llm";
import { VentureStateType } from "../state";
import { MarketIntelligenceReportSchema } from "./schema";
import { MARKET_INTELLIGENCE_SYSTEM_PROMPT } from "./prompt";
import { CalculationEngine, MarketScoringEngine, ConfidenceEngine } from "./scoring";
import { MarketIntelligenceReport } from "./types";

export async function marketIntelligenceAgent(state: VentureStateType) {
  console.log("--- Agent: Market Intelligence (TAM/SAM/SOM/Scoring) ---");

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

Based on the above facts, formulate the Market Intelligence Report. Remember to cite specific facts, sources, and dates for TAM/SAM/SOM and trends. Do not fabricate.
`;

  // 2. Query LLM with structured output schema validation
  console.log("Invoking LLM for structured market intelligence extraction...");
  
  let report: MarketIntelligenceReport;
  try {
    const structuredLlm = llm.withStructuredOutput(MarketIntelligenceReportSchema);
    const response = await structuredLlm.invoke([
      { role: "system", content: MARKET_INTELLIGENCE_SYSTEM_PROMPT },
      { role: "user", content: prompt }
    ]);
    report = response as unknown as MarketIntelligenceReport;
    if (!report || !report.tam || !report.sam || !report.som || !report.marketOverview || !report.marketAttractiveness) {
      throw new Error("Invalid or empty market intelligence report received from LLM");
    }
  } catch (err: any) {
    console.error("Structured LLM query failed for Market Intelligence, falling back to heuristic parsing:", err);
    // Safety fallback report to prevent pipeline crashes
    report = {
      marketOverview: {
        industryDescription: ventureContext?.startup_idea?.description || "Startup Opportunity",
        currentState: "Initial feasibility phase",
        industryMaturity: "Emerging",
        growthStage: "Early stage",
        marketDynamics: "High entry interest"
      },
      tam: {
        definition: "Entire addressable sector",
        value: "Missing - Insufficient verified data",
        formula: "TAM = N * P",
        calculation: "Could not compute programmatically due to missing primary sources",
        assumptions: ["Assumes baseline market size from proxy indicators"],
        sources: ["System Fallback"],
        confidence: "LOW"
      },
      sam: {
        targetMarket: "Serviceable segment within target country",
        value: "Missing - Insufficient verified data",
        geographicScope: ventureContext?.location?.country || "unknown",
        industryScope: "Target sub-sector",
        assumptions: ["Assumes default market share scaling"],
        sources: ["System Fallback"],
        confidence: "LOW"
      },
      som: {
        realisticMarketCapture: "SOM target capture",
        firstThreeYearsValue: "Missing - Insufficient verified data",
        firstFiveYearsValue: "Missing - Insufficient verified data",
        assumptions: ["Assumes 1-3% capture rates"],
        sources: ["System Fallback"],
        confidence: "LOW"
      },
      customerSegments: [
        {
          segmentName: "Primary Adopters",
          type: "Early Adopter",
          description: "Target customers with high pain point",
          painPoints: ["Lack of existing solutions"]
        }
      ],
      marketTrends: [
        {
          trend: "Digital transformation",
          type: "Technology",
          description: "Rising digital integration in target industry",
          evidenceSource: "General trend indicators"
        }
      ],
      growthDrivers: [
        {
          driver: "Market demand",
          type: "Demand Driver",
          description: "Growing adoption of new technology",
          evidenceSource: "General indicators"
        }
      ],
      marketAttractiveness: {
        score: 50,
        factors: [
          { factorName: "Market Size", score: 50, weight: 0.20, reasoning: "Baseline size score" },
          { factorName: "Growth Rate", score: 50, weight: 0.20, reasoning: "Baseline growth score" },
          { factorName: "Accessibility", score: 50, weight: 0.15, reasoning: "Baseline accessibility score" },
          { factorName: "Competition", score: 50, weight: 0.15, reasoning: "Baseline competition score" },
          { factorName: "Demand", score: 50, weight: 0.15, reasoning: "Baseline demand score" },
          { factorName: "Timing", score: 50, weight: 0.15, reasoning: "Baseline timing score" }
        ],
        reasoning: ["Baseline market attractiveness evaluation"]
      },
      confidence: {
        overallConfidence: "MEDIUM",
        sourceQualityScore: 50,
        evidenceQuantityScore: 50,
        agreementScore: 50,
        reasoning: "Heuristic fallback report utilized"
      }
    };
  }

  // 3. Programmatic Verifications & Adjustments
  
  // A. Verify TAM/SAM/SOM mathematical constraints
  const hierarchyCheck = CalculationEngine.verifyMarketHierarchies(
    report.tam.value,
    report.sam.value,
    report.som.firstFiveYearsValue || report.som.firstThreeYearsValue
  );
  console.log(`Hierarchy Check: ${hierarchyCheck.reasoning}`);
  if (!hierarchyCheck.valid) {
    console.warn("WARNING: Market size hierarchies violate mathematical ordering constraint (TAM >= SAM >= SOM)!");
    // Append the verification warning to TAM/SAM/SOM assumptions
    report.tam.assumptions.push(`Calculation Engine Warning: ${hierarchyCheck.reasoning}`);
    report.sam.assumptions.push(`Calculation Engine Warning: ${hierarchyCheck.reasoning}`);
    report.som.assumptions.push(`Calculation Engine Warning: ${hierarchyCheck.reasoning}`);
  }

  // B. Run programmatic Market Scoring Engine
  const scoringResults = MarketScoringEngine.computeScore(report.marketAttractiveness.factors);
  report.marketAttractiveness.score = scoringResults.score;
  report.marketAttractiveness.factors = scoringResults.normalizedFactors;
  console.log(`Programmatically verified Market Attractiveness Score: ${report.marketAttractiveness.score}/100`);

  // C. Run programmatic Confidence Engine
  const confidenceResults = ConfidenceEngine.evaluate(
    retrievedKnowledge,
    validatedFacts,
    reliability.overallReliability
  );
  report.confidence = confidenceResults;
  console.log(`Programmatically verified Confidence Level: ${report.confidence.overallConfidence}`);

  // 4. Update and return state, merging with existing marketIntel to preserve rawResearch
  return {
    marketIntel: {
      ...state.marketIntel,
      ...report
    }
  };
}
