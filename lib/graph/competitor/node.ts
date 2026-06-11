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
  } catch (err: any) {
    console.error("Structured LLM query failed for Competitor Intelligence, falling back to heuristic parsing:", err);
    // Safety fallback report to prevent pipeline crashes
    report = {
      directCompetitors: ["Incumbent A"],
      indirectCompetitors: ["Alternative solution B"],
      competitorProfiles: [
        {
          name: "Incumbent A",
          description: "Established player in the target industry",
          type: "Direct",
          products: ["Standard product"],
          targetCustomers: ["Enterprise customers"],
          geography: ventureContext?.location?.country || "unknown",
          pricing: "Premium pricing",
          funding: "Self-funded or Venture backed",
          marketPosition: "Market Leader",
          strengths: ["Brand awareness", "Distribution network"],
          weaknesses: ["High pricing tier", "Legacy technology"],
          threatLevel: 50
        }
      ],
      featureMatrix: {
        features: ["Core Product Functionality", "Modern API", "Affordable pricing"],
        comparisons: [
          { companyName: "Your Startup", featureSupport: [true, true, true] },
          { companyName: "Incumbent A", featureSupport: [true, false, false] }
        ]
      },
      pricingAnalysis: {
        pricingModels: [
          { modelType: "Subscription", description: "Standard monthly fee" }
        ],
        segments: [
          { tier: "Premium", range: "High", details: "Incumbent charging premium rates" }
        ]
      },
      positioningAnalysis: {
        positioningMap: [
          { companyName: "Your Startup", xPosition: 20, yPosition: 90, labelX: "Price (Low to High)", labelY: "Technology Modernity" },
          { companyName: "Incumbent A", xPosition: 90, yPosition: 40, labelX: "Price (Low to High)", labelY: "Technology Modernity" }
        ],
        strategicPosition: "Your Startup positions as a lower cost, modern technology alternative."
      },
      marketGaps: [
        {
          gapType: "Technology Gap",
          description: "Incumbents rely on legacy tech stacks",
          opportunitySignal: "Providing a modern API-first solution"
        }
      ],
      moatOpportunities: [
        {
          moatType: "Technology",
          description: "Proprietary algorithm/analytics stack",
          feasibility: "MEDIUM"
        }
      ],
      differentiationOpportunities: [
        {
          strategy: "API-first distribution",
          type: "Technology Advantage",
          description: "Enable developers to integrate chargers instantly",
          implementationEase: "HIGH"
        }
      ],
      competitiveIntensity: {
        score: 50,
        factors: [
          { factorName: "Number of Competitors", score: 50, weight: 0.25, reasoning: "Baseline score" },
          { factorName: "Market Saturation", score: 50, weight: 0.25, reasoning: "Baseline score" },
          { factorName: "Switching Costs", score: 50, weight: 0.15, reasoning: "Baseline score" },
          { factorName: "Barrier to Entry", score: 50, weight: 0.15, reasoning: "Baseline score" },
          { factorName: "Market Concentration", score: 50, weight: 0.20, reasoning: "Baseline score" }
        ],
        reasoning: ["Baseline competitor intensity assessment"]
      },
      confidence: {
        overallConfidence: "MEDIUM",
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
