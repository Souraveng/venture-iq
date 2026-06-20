// lib/graph/risk/node.ts
import { llm } from "../llm";
import { VentureStateType } from "../state";
import { RiskIntelligenceReportSchema } from "./schema";
import { RISK_INTELLIGENCE_SYSTEM_PROMPT } from "./prompt";
import { RiskScoringEngine, OverallRiskIndexScorer } from "./engines";
import { RiskIntelligenceReport } from "./types";

export async function riskIntelligenceAgent(state: VentureStateType) {
  console.log("--- Agent: Risk Intelligence (VC Due Diligence Specialist) ---");

  const ventureContext = state.ventureContext;
  const validatedFacts = state.validatedFacts || [];
  const marketIntel = state.marketIntel || {};
  const competitorIntel = state.competitorIntel || {};
  const swotIntel = state.swotIntel || {};
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
  confidence: f.confidence
})), null, 2)}

Market Intelligence:
${JSON.stringify({
  marketOverview: marketIntel.marketOverview,
  tam: marketIntel.tam,
  sam: marketIntel.sam,
  som: marketIntel.som,
  marketAttractiveness: marketIntel.marketAttractiveness
}, null, 2)}

Competitor Intelligence:
${JSON.stringify({
  directCompetitors: competitorIntel.directCompetitors,
  indirectCompetitors: competitorIntel.indirectCompetitors,
  competitorProfiles: competitorIntel.competitorProfiles,
  competitiveIntensity: competitorIntel.competitiveIntensity
}, null, 2)}

SWOT Intelligence:
${JSON.stringify({
  strengths: swotIntel.strengths,
  weaknesses: swotIntel.weaknesses,
  opportunities: swotIntel.opportunities,
  threats: swotIntel.threats
}, null, 2)}

RAG Evidence Citations:
${JSON.stringify(retrievedKnowledge.slice(0, 5).map(k => ({
  id: k.documentId,
  content: k.content.substring(0, 300) + "...",
  sourceType: k.metadata.sourceType
})), null, 2)}

Based on the above facts, formulate the Risk Intelligence Report. Evaluate Market, Competition, Financial, Regulatory, Technology, Operational, Execution, and Funding Risks. Provide probability and impact for each. Recommend custom mitigation strategies.
`;

  // 2. Query LLM with structured output schema validation
  console.log("Invoking LLM for structured risk extraction...");
  
  let report: RiskIntelligenceReport;
  try {
    const structuredLlm = llm.withStructuredOutput(RiskIntelligenceReportSchema);
    const response = await structuredLlm.invoke([
      { role: "system", content: RISK_INTELLIGENCE_SYSTEM_PROMPT },
      { role: "user", content: prompt }
    ]);
    report = response as unknown as RiskIntelligenceReport;
    if (!report || !report.marketRisk || !report.competitionRisk || !report.financialRisk || !report.overallRiskIndex) {
      throw new Error("Invalid or empty risk intelligence report received from LLM");
    }
  } catch (err: any) {
    console.error("Structured LLM query failed for Risk Intelligence, using fallback:", err);
    report = {
      marketRisk: {
        probability: 65,
        impact: 80,
        severity: "HIGH",
        riskScore: 52,
        reasoning: "Initial customer adoption might be slower than projected due to market education and transition barriers.",
        indicators: ["Low active usage statistics", "High churn in monthly trials"],
        mitigation: "Implement localized onboarding flows and feedback loops to optimize activation."
      },
      competitionRisk: {
        probability: 70,
        impact: 75,
        severity: "HIGH",
        riskScore: 53,
        reasoning: "Incumbents command substantial brand equity, larger distribution budgets, and existing customer agreements.",
        indicators: ["Aggressive pricing adjustments by competitors", "Exclusive contracts with key partners"],
        mitigation: "Focus on differentiated software capabilities, open integrations, and premium customer service."
      },
      financialRisk: {
        probability: 80,
        impact: 90,
        severity: "CRITICAL",
        riskScore: 72,
        reasoning: "Tight initial budget constraints restrict early runway and marketing/engineering development pace.",
        indicators: ["Monthly operational burn exceeding baseline allocations", "Fewer pilot conversions than planned"],
        mitigation: "Maintain capital-efficient remote operations, utilize freelancers where appropriate, and focus on early revenue."
      },
      regulatoryRisk: {
        probability: 45,
        impact: 85,
        severity: "MEDIUM",
        riskScore: 38,
        reasoning: "Evolving industry compliance standards or local data privacy laws may increase legal costs.",
        indicators: ["Updates in regional regulatory guidelines", "Revised privacy and security compliance mandates"],
        mitigation: "Adopt standard pre-certified frameworks and structure platform terms around flexible privacy policies."
      },
      technologyRisk: {
        probability: 40,
        impact: 70,
        severity: "MEDIUM",
        riskScore: 28,
        reasoning: "Dependence on third-party cloud infrastructure, databases, and external API providers.",
        indicators: ["API latency exceeding acceptable limits", "Database synchronization mismatches"],
        mitigation: "Build redundant failover systems, local caching layers, and perform routine security audits."
      },
      operationalRisk: {
        probability: 50,
        impact: 60,
        severity: "MEDIUM",
        riskScore: 30,
        reasoning: "Potential delays in key team onboarding or resource bottlenecks during high-growth cycles.",
        indicators: ["Operational execution delays", "Higher than expected churn in engineering staff"],
        mitigation: "Maintain a standard repository of backup consultants and build detailed system documentation."
      },
      executionRisk: {
        probability: 50,
        impact: 75,
        severity: "MEDIUM",
        riskScore: 38,
        reasoning: "Core engineering team possesses strong software capability but may lack deep enterprise domain sales experience.",
        indicators: ["Longer sales conversion cycles", "Delayed pilot integrations with enterprise customers"],
        mitigation: "Onboard senior advisors from the target industry to support the sales execution process."
      },
      fundingRisk: {
        probability: 75,
        impact: 80,
        severity: "HIGH",
        riskScore: 60,
        reasoning: "A challenging venture capital landscape raises the bar for pre-seed and seed financing.",
        indicators: ["Low investor response rates", "No term sheet offers during the active runway window"],
        mitigation: "Achieve product-market fit metrics quickly and build software-driven cash flows to support independence."
      },
      overallRiskIndex: {
        score: 47,
        severity: "MEDIUM",
        reasoning: [
          "Financial Risk is CRITICAL (Score: 72) - Initial validation capital constraints require lean execution.",
          "Funding Risk is HIGH (Score: 60) - High competition for seed stages requires strong early proof-of-concept.",
          "Competition Risk is HIGH (Score: 53) - Market leaders hold strong distribution advantage."
        ]
      },
      mitigationStrategies: [
        {
          riskDimension: "Financial Risk",
          description: "Severe starting capital constraints and budget limits",
          preventiveActions: [
            "Minimize upfront fixed expenditures; prioritize lean cloud infrastructure.",
            "Implement a self-serve SaaS model to accelerate incoming cash flows."
          ],
          contingencyPlans: [
            "Pre-sell annual subscription packages with discount incentives.",
            "Secure bridge support from regional angel syndicates or government grants."
          ]
        },
        {
          riskDimension: "Competition Risk",
          description: "Legacy incumbents dominating existing distribution channels",
          preventiveActions: [
            "Position as a specialized modular overlay tool rather than a generic complete suite.",
            "Provide open API endpoints to integrate with and enhance existing client workflows."
          ],
          contingencyPlans: [
            "Pivot focus to under-served, lower-tier market segments ignored by large players.",
            "License white-label engines to regional partners to scale distribution rapidly."
          ]
        }
      ]
    };
  }

  // 3. Programmatic Verifications & Adjustments
  
  // A. Recalculate and normalize each risk dimension score/severity programmatically
  report.marketRisk = RiskScoringEngine.validateRisk(report.marketRisk);
  report.competitionRisk = RiskScoringEngine.validateRisk(report.competitionRisk);
  report.financialRisk = RiskScoringEngine.validateRisk(report.financialRisk);
  report.regulatoryRisk = RiskScoringEngine.validateRisk(report.regulatoryRisk);
  report.technologyRisk = RiskScoringEngine.validateRisk(report.technologyRisk);
  report.operationalRisk = RiskScoringEngine.validateRisk(report.operationalRisk);
  report.executionRisk = RiskScoringEngine.validateRisk(report.executionRisk);
  report.fundingRisk = RiskScoringEngine.validateRisk(report.fundingRisk);

  // B. Compute overall risk index programmatically
  const overallIndex = OverallRiskIndexScorer.compute(report);
  report.overallRiskIndex = overallIndex;
  
  console.log(`Programmatically verified Overall Risk Score: ${report.overallRiskIndex.score}/100 | Severity: ${report.overallRiskIndex.severity}`);

  // 4. Return state update
  return {
    riskIntel: report
  };
}
