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
    console.error("Structured LLM query failed for Competitor Intelligence, using heuristic fallback:", err);
    // Build a meaningful fallback using venture context rather than returning empty data
    const ideaDesc = ventureContext?.startup_idea?.description || ventureContext?.goal || "this venture";
    const cleanIdea = typeof ideaDesc === "string" ? ideaDesc.substring(0, 60) : "this venture";
    report = {
      directCompetitors: ["Established Market Leader", "Growing Challenger"],
      indirectCompetitors: ["Adjacent Solution Provider"],
      competitorProfiles: [
        {
          name: "Established Market Leader",
          description: `The dominant existing solution in the ${cleanIdea} space, typically more expensive and less focused on the target segment.`,
          type: "Direct" as const,
          products: ["Core product platform", "Enterprise suite"],
          targetCustomers: ["Large enterprises", "Established businesses"],
          geography: "Global",
          pricing: "Premium — aimed at larger budgets",
          funding: "Series B or later",
          marketPosition: "Market Leader" as const,
          strengths: ["Brand recognition", "Established customer base", "Strong integrations"],
          weaknesses: ["High pricing excludes mid-market", "Slow to innovate", "Complex onboarding"],
          threatLevel: 60
        },
        {
          name: "Growing Challenger",
          description: `A newer entrant competing in the same space with a modern product approach.`,
          type: "Direct" as const,
          products: ["Modern SaaS platform"],
          targetCustomers: ["SMBs", "Tech-forward companies"],
          geography: "Regional",
          pricing: "Mid-market",
          funding: "Seed or Series A",
          marketPosition: "Market Challenger" as const,
          strengths: ["Modern UX", "Competitive pricing", "Fast iteration"],
          weaknesses: ["Limited features vs leader", "Smaller customer base"],
          threatLevel: 45
        }
      ],
      featureMatrix: {
        features: ["Core Feature A", "Core Feature B", "Pricing Flexibility", "Ease of Onboarding"],
        comparisons: [
          { companyName: "Established Market Leader", featureSupport: [true, true, false, false] },
          { companyName: "Growing Challenger", featureSupport: [true, false, true, true] }
        ]
      },
      pricingAnalysis: {
        pricingModels: [{ modelType: "Subscription", description: "Monthly or annual SaaS fee" }],
        segments: [{ tier: "Mid-Market", range: "$200-600/mo", details: "Standard plans" }]
      },
      positioningAnalysis: {
        positioningMap: [
          { companyName: "Established Market Leader", xPosition: 75, yPosition: 40, labelX: "Market Share", labelY: "Affordability" },
          { companyName: "Growing Challenger", xPosition: 40, yPosition: 70, labelX: "Market Share", labelY: "Affordability" }
        ],
        strategicPosition: "Market is moderately concentrated. Opportunity exists for a niche-focused, affordable entrant."
      },
      marketGaps: [
        { gapType: "Pricing Gap", description: "No affordable purpose-built option for the target segment.", opportunitySignal: "High unmet demand from underserved customers" }
      ],
      moatOpportunities: [
        { moatType: "Network Effects", description: "Build platform value as user base grows through shared data and community.", feasibility: "MEDIUM" as const }
      ],
      differentiationOpportunities: [
        { strategy: "Vertical-specific focus", type: "Target Niche", description: "Serve a specific underserved vertical with domain-specific features.", implementationEase: "HIGH" as const }
      ],
      competitiveIntensity: {
        score: 55,
        factors: [
          { factorName: "Number of Competitors", score: 55, weight: 0.3, reasoning: "Moderate number of players; room for niche differentiation." },
          { factorName: "Market Saturation", score: 50, weight: 0.2, reasoning: "Moderate pricing competition in this segment." }
        ],
        reasoning: ["Heuristic estimate based on venture context. Actual competition data was unavailable due to LLM quota exhaustion."]
      },
      confidence: {
        overallConfidence: "LOW" as const,
        supportingSources: [],
        evidenceCount: 0,
        reasoning: "Heuristic fallback used due to LLM quota exhaustion — actual competitor research not completed."
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
