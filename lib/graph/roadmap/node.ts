// lib/graph/roadmap/node.ts
import { llm } from "../llm";
import { VentureStateType } from "../state";
import { FounderRoadmapReportSchema } from "./schema";
import { FOUNDER_ROADMAP_SYSTEM_PROMPT } from "./prompt";
import { MilestoneDependencyEngine, TimelineAlignmentEngine } from "./engines";
import { FounderRoadmapReport } from "./types";


export async function roadmapIntelligenceAgent(state: VentureStateType) {
  console.log("--- Agent: Founder Roadmap & Execution Intelligence ---");

  const ventureContext = state.ventureContext;
  const validatedFacts = state.validatedFacts || [];
  const marketIntel = state.marketIntel || {};
  const competitorIntel = state.competitorIntel || {};
  const swotIntel = state.swotIntel || {};
  const riskIntel = state.riskIntel || {};
  const financialIntel = state.financialIntel || {};
  const finalReport = state.finalReport || {};

  // 1. Build structured prompt
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

Market Intelligence (TAM/SAM/SOM):
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
  competitiveIntensity: competitorIntel.competitiveIntensity
}, null, 2)}

SWOT Strategic Elements:
${JSON.stringify({
  strengths: swotIntel.strengths,
  weaknesses: swotIntel.weaknesses,
  opportunities: swotIntel.opportunities,
  threats: swotIntel.threats
}, null, 2)}

Risk Analysis Severity Profiles:
${JSON.stringify({
  overallScore: riskIntel.overallRiskIndex?.score,
  overallSeverity: riskIntel.overallRiskIndex?.severity,
  reasoning: riskIntel.overallRiskIndex?.reasoning || []
}, null, 2)}

Financial Analysis Parameters:
${JSON.stringify({
  startupCosts: financialIntel.startupCosts?.scenarios,
  revenueProjections: financialIntel.revenueForecast?.revenueProjections,
  unitEconomics: financialIntel.unitEconomics,
  breakEven: financialIntel.breakEvenAnalysis,
  roi: financialIntel.roiAnalysis
}, null, 2)}

Venture Analyst / VC Investor Report:
${JSON.stringify({
  investmentRecommendation: finalReport.investmentRecommendation,
  redFlags: finalReport.redFlags,
  moatAnalysis: finalReport.moatAnalysis,
  ventureReadiness: finalReport.ventureReadiness
}, null, 2)}

Based on the above intelligence inputs, formulate the Founder Roadmap & Execution Report. Emphasize validation first, address red flags directly in validation experiments, respect the budget and financial constraints stated in the Venture Opportunity Context above for the initial validation stage, and prioritize hiring sequence. Ensure milestones have dependencies.
`;

  // 2. Query LLM
  console.log("Invoking LLM for structured roadmap generation...");
  let report: FounderRoadmapReport;

  try {
    const structuredLlm = llm.withStructuredOutput(FounderRoadmapReportSchema);
    const response = await structuredLlm.invoke([
      { role: "system", content: FOUNDER_ROADMAP_SYSTEM_PROMPT },
      { role: "user", content: prompt }
    ]);
    report = response as unknown as FounderRoadmapReport;
    if (!report || !report.milestones || !report.hiringRoadmap) {
      throw new Error("Invalid or empty founder roadmap report received from LLM");
    }
  } catch (err: any) {
    console.error("Structured LLM query failed for Founder Roadmap, using heuristic fallback:", err);
    report = {
      "30DayPlan": [
        "Conduct 15-20 customer discovery interviews to validate assumptions",
        "Define MVP scope with key differentiating features only",
        "Identify and engage 3-5 potential pilot customers",
        "Set up core product infrastructure and development environment"
      ],
      "90DayPlan": [
        "Launch MVP to pilot cohort",
        "Collect structured feedback and iterate on product",
        "Define pricing model and validate willingness to pay",
        "Generate first paid transactions or LOIs",
        "Establish key success metrics and tracking framework"
      ],
      "1YearPlan": [
        "Grow to 25+ paying customers",
        "Close seed funding round",
        "Build initial team of 3-5 people",
        "Achieve $10K+ MRR milestone",
        "Establish partnerships with 2-3 channel partners"
      ],
      validationRoadmap: [
        { type: "customer_interview" as const, task: "Complete 15 customer discovery interviews", successMetric: "15 interviews completed", failureCriteria: "Fewer than 8 completed in 2 weeks" },
        { type: "pricing_test" as const, task: "Test pricing willingness with pilot candidates", successMetric: "3+ candidates willing to pay", failureCriteria: "No candidates willing to pay stated price" },
        { type: "pilot_program" as const, task: "Launch MVP to 5-person pilot cohort", successMetric: "5 active pilot users", failureCriteria: "Fewer than 2 active users after 30 days" }
      ],
      goToMarketPlan: {
        customerAcquisitionStrategy: "Content-led inbound supplemented by targeted direct outreach to ideal customer profiles",
        channels: ["LinkedIn direct outreach", "Content marketing and SEO", "Industry community engagement"],
        partnerships: ["Integration partners in complementary tools", "Channel resellers in target verticals"],
        marketing: ["Blog content targeting ICP pain points", "Case studies from early customers", "Community presence"],
        sales: ["Founder-led sales in months 1-6", "Hire first sales rep after PMF signal", "Land-and-expand account model"],
        distribution: ["Self-serve onboarding for SMB tier", "Assisted onboarding for enterprise tier"]
      },
      fundraisingRoadmap: {
        bootstrapStage: ["Build MVP with minimal capital", "Reach first 5 paying customers"],
        grantStage: ["Apply for innovation grants if eligible", "Explore government SMB support programs"],
        angelStage: ["Raise $50-100K from angels for runway extension", "Leverage advisors for warm intros"],
        seedStage: ["Raise $250K seed on SAFE terms", "Target micro-VCs and domain-expert angels"],
        requirements: {
          bootstrap: ["Working MVP", "3+ customer letters of intent"],
          grant: ["Registered entity", "Innovation eligibility criteria"],
          angel: ["Validated customer problem", "Early revenue or strong pilot data"],
          seed: ["Clear PMF signal", "Repeatable customer acquisition pattern", "$10K+ MRR"]
        }
      },
      hiringRoadmap: [
        { role: "Co-founder or Technical Lead", priority: 1, department: "Engineering" as const, timeline: "Month 1-3", justification: "Core product development requires technical execution" },
        { role: "Sales Development Rep", priority: 2, department: "Sales" as const, timeline: "Month 7-9", justification: "Scale customer acquisition after PMF signal confirmed" },
        { role: "Customer Success Manager", priority: 3, department: "Operations" as const, timeline: "Month 10-12", justification: "Reduce churn and increase net revenue retention" }
      ],
      milestones: [
        { id: "m1", goal: "Customer discovery complete", successCriteria: "15 structured interviews with target customers completed", timeline: "Month 1", priority: "HIGH" as const, dependencies: [] },
        { id: "m2", goal: "MVP launched to pilot cohort", successCriteria: "MVP deployed with 3+ active pilot testers", timeline: "Month 2-3", priority: "HIGH" as const, dependencies: ["m1"] },
        { id: "m3", goal: "First paying customer", successCriteria: "First paid transaction closed", timeline: "Month 3-4", priority: "HIGH" as const, dependencies: ["m2"] },
        { id: "m4", goal: "Seed funding close", successCriteria: "$250K seed raised via SAFE", timeline: "Month 9-12", priority: "MEDIUM" as const, dependencies: ["m3"] }
      ],
      priorityMatrix: {
        highImpactLowEffort: ["Customer discovery interviews", "Set up analytics tracking", "Define pricing structure"],
        highImpactHighEffort: ["Build and ship MVP", "Close seed funding", "Hire first sales rep"],
        lowImpactLowEffort: ["Social media presence", "Initial landing page", "Email newsletter setup"],
        lowImpactHighEffort: ["Enterprise integrations", "Multi-language support", "Advanced reporting"]
      },
      keySuccessFactors: [
        "Deeply understanding the customer problem before building",
        "Maintaining a tight feedback loop with early customers",
        "Keeping burn rate low until PMF is confirmed",
        "Focusing on one segment before expanding"
      ]
    };
  }

  // 3. Programmatic Engines
  // A. Sort milestones topologically and clean circular dependencies
  report.milestones = MilestoneDependencyEngine.sortAndClean(report.milestones);

  // B. Align timelines to respect dependencies
  report.milestones = TimelineAlignmentEngine.align(report.milestones);

  console.log(`Programmatically verified and sorted ${report.milestones.length} milestones topologically.`);

  // 4. Return state update
  return {
    roadmapIntel: report
  };
}
