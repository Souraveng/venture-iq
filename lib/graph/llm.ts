// lib/graph/llm.ts
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { AsyncLocalStorage } from "async_hooks";
import fs from "fs";
import path from "path";

// Prioritize local .env.local file configuration over global Windows environment variables
(function loadEnvLocal() {
  try {
    const envPath = path.join(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
          const firstEqual = trimmed.indexOf("=");
          const key = trimmed.substring(0, firstEqual).trim();
          let val = trimmed.substring(firstEqual + 1).trim();
          // Remove wrapping quotes if present
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.substring(1, val.length - 1);
          }
          if (key) {
            process.env[key] = val;
          }
        }
      }
    }
  } catch (e) {
    console.warn("Could not load .env.local manually:", e);
  }
})();

export interface RequestKeys {
  geminiApiKey?: string;
  cloudflareApiToken?: string;
  cloudflareAccountId?: string;
  cloudflareApiToken1?: string;
  cloudflareAccountId1?: string;
  cloudflareApiToken2?: string;
  cloudflareAccountId2?: string;
  cloudflareApiToken3?: string;
  cloudflareAccountId3?: string;
  cloudflareApiToken4?: string;
  cloudflareAccountId4?: string;
  // Tier-aware routing: free users → Llama 3.3 (Cloudflare), premium → Gemini
  userTier?: "free" | "premium";
}

// Context storage for request-bound API keys
export const apiKeyStorage = new AsyncLocalStorage<RequestKeys>();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const THROTTLE_DELAY_MS = 1500;

// Module-level flag: once Cloudflare returns a 429 quota error, permanently skip all further Cloudflare calls
let cloudflareQuotaExhausted = false;

// Query Cloudflare Workers AI Llama 3.3 model
async function queryCloudflare(
  messages: { role: string; content: string }[],
  apiToken: string,
  accountId: string,
  model: string
): Promise<string> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages,
      temperature: 0.2,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Cloudflare AI returned status ${response.status}: ${errText}`);
  }

  const data = await response.json();
  
  if (!data.success) {
    const errors = data.errors ? JSON.stringify(data.errors) : "Unknown error";
    throw new Error(`Cloudflare AI API Error: ${errors}`);
  }

  const text = data.result?.response;
  if (!text) {
    throw new Error("Empty response returned from Cloudflare Workers AI");
  }
  return text;
}

// Query Google Gemini API (completely free tier available via Google AI Studio)
async function queryGemini(prompt: string, apiKey: string): Promise<string> {
  const model = process.env.GEMINI_LLM_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt,
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.2,
      }
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API returned status ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Empty response returned from Gemini API");
  }
  return text;
}

// Generate simple mock fallback response
function queryMock(prompt: string): string {
  console.log("[LLM Fallback] Generating mock fallback response...");
  const lower = prompt.toLowerCase();

  // 1. Research Planner
  if (lower.includes("researchplanneroutputschema") || (lower.includes("research_dimensions") && lower.includes("search_queries"))) {
    return JSON.stringify({
      research_objective: "Evaluate market opportunity, competitive landscape, and financial viability of this business concept",
      research_depth: "MEDIUM",
      research_dimensions: { market: true, competition: true, customers: true, regulations: false, finance: true, funding: false, technology: true, operations: false },
      search_queries: {
        market: ["industry market size growth trends", "target market customer segments analysis"],
        competition: ["main competitors market share analysis", "competitive landscape industry overview"],
        customers: ["customer pain points problems to solve", "target audience needs and behaviors"],
        regulations: ["industry regulations compliance requirements"],
        finance: ["revenue model pricing strategy industry benchmarks"],
        funding: [],
        technology: ["technology options for this type of business platform"],
        operations: []
      },
      source_priorities: [{ source_type: "Industry Reports", priority: 1, reason: "Accurate market data" }],
      risk_focus_areas: ["Market adoption", "Competitive pressure"],
      critical_unknowns: ["Customer willingness to pay", "Market timing"]
    }, null, 2);
  }

  // 2. Evidence Extraction
  if (lower.includes("evidenceextractionschema") || (lower.includes("documenttype") && lower.includes("scores") && lower.includes("freshness"))) {
    return JSON.stringify({
      metadata: { title: "Industry Market Analysis Report", source: "Industry Research Publication", domain: "research.com", author: "Research Team", publishDate: "2026-01-15", country: "Global", industry: "Business Services", documentType: "Research Report" },
      scores: { authority: 80, relevance: 85, freshness: 78, overallScore: 81, domainReputation: 82 }
    }, null, 2);
  }

  // 3. Structured Knowledge
  if (lower.includes("structuredknowledgeschema") || (lower.includes("facts") && lower.includes("entities") && lower.includes("relationships"))) {
    return JSON.stringify({
      facts: [
        { statement: "The addressable market is growing at a significant annual rate driven by increasing customer demand.", confidence: "medium", impactTier: 1, impactScore: 75, evidenceId: "gen-1" },
        { statement: "Businesses in this sector typically achieve gross margins between 50-80% at scale.", confidence: "medium", impactTier: 2, impactScore: 65, evidenceId: "gen-1" }
      ],
      entities: [
        { id: "ent-market", name: "Target Market", type: "Market", description: "The primary addressable customer segment" },
        { id: "ent-industry", name: "Industry", type: "Sector", description: "The broader industry ecosystem" }
      ],
      relationships: [{ sourceEntityId: "ent-market", relationType: "drives", targetEntityId: "ent-industry", description: "Target market growth drives industry expansion" }]
    }, null, 2);
  }

  // 4. Fact Validation
  if (lower.includes("factvalidationschema") || (lower.includes("evaluations") && lower.includes("overallreliability") && lower.includes("crossreferencedclaims"))) {
    return JSON.stringify({
      evaluations: [{ factId: "fact-1", isVerified: true, confidenceScore: 75, contradictions: [], verifyingSources: ["gen-1"] }],
      crossReferencedClaims: [{ claim: "Market is growing at a significant rate", supportingSourceIds: ["gen-1"], contradictingSourceIds: [], consensusStatus: "partially-verified" }],
      overallReliability: 70
    }, null, 2);
  }

  // 5. Market Intelligence
  if (lower.includes("marketintelligenceschema") || (lower.includes("tamsamsom") || (lower.includes("tam") && lower.includes("sam") && lower.includes("som")))) {
    return JSON.stringify({
      marketSize: { tam: 45000000, sam: 12000000, som: 1500000, growthRate: 18.5, methodology: "Bottom-up estimation based on addressable customer segments" },
      trends: [{ trend: "Digital transformation adoption", impact: "High", timeframe: "1-3 years" }],
      demographics: { targetCustomers: ["Small and medium businesses", "Enterprise clients"], painPoints: ["Manual processes costing time", "No scalable solution available"] }
    }, null, 2);
  }

  // 6. Competitor Intelligence
  if (lower.includes("competitorintelligenceschema") || (lower.includes("competitiveintensity") && lower.includes("market concentration"))) {
    return JSON.stringify({
      directCompetitors: ["Established Market Leader", "Growing Challenger"],
      indirectCompetitors: ["Adjacent Solution Provider"],
      competitorProfiles: [{ name: "Established Market Leader", description: "Leading provider with strong market presence.", type: "Direct", products: ["Core Product Suite"], targetCustomers: ["Enterprise customers"], geography: "Global", pricing: "Premium pricing", funding: "Series B funded", marketPosition: "Market Leader", strengths: ["Brand recognition", "Large customer base"], weaknesses: ["Slow innovation", "High pricing"], threatLevel: 60 }],
      featureMatrix: { features: ["Core Feature A", "Core Feature B"], comparisons: [{ companyName: "Established Market Leader", featureSupport: [true, false] }] },
      pricingAnalysis: { pricingModels: [{ modelType: "Subscription", description: "Monthly SaaS fee" }], segments: [{ tier: "Mid-Market", range: "$200-500/mo", details: "Standard plan" }] },
      positioningAnalysis: { positioningMap: [{ companyName: "Established Market Leader", xPosition: 70, yPosition: 65, labelX: "Market Share", labelY: "Feature Richness" }], strategicPosition: "Market is moderately concentrated with room for differentiated entrants." },
      marketGaps: [{ gapType: "Pricing Gap", description: "No affordable option for SMB customers exists.", opportunitySignal: "High unmet demand from smaller businesses" }],
      moatOpportunities: [{ moatType: "Network Effects", description: "Build platform network effects as user base grows.", feasibility: "MEDIUM" }],
      differentiationOpportunities: [{ strategy: "Vertical-specific solution", type: "Market Niche", description: "Serve a specific underserved industry vertical.", implementationEase: "HIGH" }],
      competitiveIntensity: { score: 55, factors: [{ factorName: "Number of Competitors", score: 55, weight: 0.3, reasoning: "Moderate players, room for differentiation." }], reasoning: ["Moderate competitive intensity with opportunity for niche positioning."] },
      confidence: { overallConfidence: "MEDIUM", supportingSources: ["gen-1"], evidenceCount: 1, reasoning: "Based on available research data." }
    }, null, 2);
  }

  // 7. SWOT
  if (lower.includes("swotschema") || (lower.includes("strengths") && lower.includes("weaknesses") && lower.includes("opportunities") && lower.includes("threats"))) {
    return JSON.stringify({
      strengths: [{ statement: "First-mover advantage in an underserved niche", evidence: ["gen-1"], confidence: "MEDIUM", impactScore: 75, impactTier: "HIGH" }],
      weaknesses: [{ statement: "Limited brand recognition early on", evidence: ["gen-1"], confidence: "HIGH", impactScore: 60, impactTier: "MEDIUM" }],
      opportunities: [{ statement: "Growing market demand with no dominant low-cost solution", evidence: ["gen-1"], confidence: "MEDIUM", impactScore: 85, impactTier: "HIGH" }],
      threats: [{ statement: "Established players may expand into this segment", evidence: ["gen-1"], confidence: "MEDIUM", impactScore: 55, impactTier: "MEDIUM" }],
      strategicSummary: { topStrengths: ["Niche first-mover advantage"], topWeaknesses: ["Limited early brand awareness"], topOpportunities: ["Unserved market with strong demand"], topThreats: ["Risk of incumbent retaliation"] }
    }, null, 2);
  }

  // 8. Risk Intelligence
  if (lower.includes("riskschema") || (lower.includes("risks") && lower.includes("overallriskindex") && lower.includes("mitigationstrategies"))) {
    const dr = { probability: 30, impact: 50, severity: "MEDIUM" as const, riskScore: 15, reasoning: "General operational risk.", indicators: ["Revenue delays"], mitigation: "Proactive monitoring." };
    return JSON.stringify({
      marketRisk: dr, competitionRisk: { ...dr, reasoning: "Competitive pressure from incumbents." }, financialRisk: { ...dr, reasoning: "Cash flow during early growth." },
      regulatoryRisk: { probability: 20, impact: 40, severity: "LOW" as const, riskScore: 8, reasoning: "Regulatory environment is relatively stable.", indicators: ["Policy changes"], mitigation: "Monitor and consult legal counsel." },
      technologyRisk: dr, operationalRisk: dr, executionRisk: dr, fundingRisk: dr,
      overallRiskIndex: { score: 38, severity: "MEDIUM" as const, reasoning: ["Market adoption is the primary risk vector."] },
      mitigationStrategies: [{ riskDimension: "Market Risk", description: "Customer validation and pilot programs", preventiveActions: ["Customer discovery interviews"], contingencyPlans: ["Pivot to adjacent use case"] }]
    }, null, 2);
  }

  // 9. Financial Intelligence
  if (lower.includes("financialschema") || (lower.includes("financialintelligence") && lower.includes("uniteconomics"))) {
    const ct = { min: 5000, expected: 10000, aggressive: 20000 };
    return JSON.stringify({
      startupCosts: { infrastructure: ct, technology: ct, equipment: ct, licensing: ct, operations: ct, marketing: ct, team: ct, legal: ct, scenarios: { min: { total: 40000 }, expected: { total: 80000 }, aggressive: { total: 160000 } } },
      revenueForecast: { revenueProjections: { year1: 120000, year2: 350000, year3: 800000, year5: 2500000 }, mrrProjections: { year1: 10000, year2: 29000, year3: 67000, year5: 208000 }, assumptions: ["SaaS pricing model", "Steady customer growth"], growthDrivers: ["Word-of-mouth", "Inbound marketing"], customerAcquisition: ["Direct outreach", "Partnerships"], pricing: ["Tiered subscription"], confidenceScore: 70 },
      unitEconomics: { cac: 600, ltv: 5400, ltvToCacRatio: 9.0, grossMargin: 72, contributionMargin: 65, paybackPeriod: 5, revenuePerCustomer: 250 },
      breakEvenAnalysis: { breakEvenRevenue: 80000, breakEvenCustomers: 32, breakEvenTimelineMonths: 14, methodology: "Fixed overhead vs contribution margin." },
      roiAnalysis: { expectedRoi: 200, conservativeRoi: 100, optimisticRoi: 450, riskAdjustedRoi: 175 },
      fundingRequirements: { capitalNeeded: 250000, bootstrapFeasibility: true, bootstrapReasoning: "Possible to begin lean and reinvest.", grantOpportunities: ["Innovation grants"], investorSuitability: "Seed-stage angels and micro-VCs.", fundingTimeline: "6-9 months", allocation: { productEng: 45, salesMarketing: 35, operations: 10, legalGna: 10 } },
      cashFlowForecast: { forecast: [{ period: "Year 1", revenue: 120000, expenses: 150000, cashflow: -30000 }, { period: "Year 2", revenue: 350000, expenses: 220000, cashflow: 130000 }], cashShortages: ["Q1-Q3 negative cash flow"], fundingGaps: ["Seed funding needed"], liquidityRisks: ["Working capital during early growth"] },
      profitabilityAnalysis: { grossProfit: 86000, operatingProfit: -30000, netProfitPotential: 350000, grossMargin: 72, operatingMargin: 60, profitabilityTimelineMonths: 14 },
      financialViability: { score: 78, reasoning: ["Strong unit economics with LTV:CAC above 9:1."] },
      scenarios: { bestCase: { revenue: 2500000, costs: 600000, profit: 1900000, roi: 450, riskLevel: "LOW" }, expectedCase: { revenue: 800000, costs: 350000, profit: 450000, roi: 200, riskLevel: "MEDIUM" }, worstCase: { revenue: 250000, costs: 220000, profit: 30000, roi: 100, riskLevel: "HIGH" } }
    }, null, 2);
  }

  // 10. Venture Analyst
  if (lower.includes("ventureanalystschema") || (lower.includes("investmentreadinessscore") && lower.includes("thesis"))) {
    return JSON.stringify({ investmentReadinessScore: 68, strengths: ["Scalable business model", "Clear value proposition"], redFlags: ["Early-stage unvalidated assumptions"], thesis: "This venture targets an underserved segment with scalable unit economics.", dealTerms: { suggestedValuation: 1200000, fundingRequired: 250000, instrument: "SAFE" } }, null, 2);
  }

  // 11. Founder Roadmap
  if (lower.includes("roadmapschema") || (lower.includes("phases") && lower.includes("criticalpath"))) {
    return JSON.stringify({
      phases: [
        { phaseNumber: 1, title: "Discovery & MVP", durationMonths: 3, tasks: ["Customer interviews", "Build MVP", "Recruit pilot users"], milestones: ["10 interviews done", "MVP launched to pilot"] },
        { phaseNumber: 2, title: "Pilot & Iterate", durationMonths: 3, tasks: ["Collect feedback", "Refine pricing", "Add core features"], milestones: ["5 paying customers"] },
        { phaseNumber: 3, title: "Growth & Scale", durationMonths: 6, tasks: ["Scale marketing", "Hire team", "Seek seed funding"], milestones: ["25+ customers", "Seed close"] }
      ],
      criticalPath: ["Customer validation", "MVP development", "First paying customers", "Seed funding"]
    }, null, 2);
  }

  // 12. Decision Engine
  if (lower.includes("decisionschema") || (lower.includes("opportunityscore") && lower.includes("verdict"))) {
    return JSON.stringify({
      opportunityScore: { score: 68, breakdown: { marketOpportunityScore: 72, competitionScore: 60, financialViabilityScore: 70, executionFeasibilityScore: 68, fundingPotentialScore: 62, riskResilienceScore: 65 } },
      investorReadiness: { score: 60, reasoning: ["Needs customer validation to attract institutional investors."] },
      executionReadiness: { score: 68, reasoning: ["Relevant domain knowledge; manageable execution risk."] },
      ventureReadiness: { stage: "EARLY_VALIDATION", score: 65 },
      confidence: { score: 60, reasoning: ["Moderate confidence; limited validated data at this stage."] },
      verdict: { decision: "PROCEED WITH CAUTION", reasoning: ["Real opportunity — requires customer validation before scaling."] },
      topOpportunities: ["Unserved mid-market segment", "Network effects as first mover"],
      topRisks: ["Longer-than-expected customer conversion", "Cash constraints during ramp"],
      recommendedActions: ["Run 15-20 customer discovery interviews", "Launch 5-customer paid pilot within 60 days"],
      executiveSummary: "This venture presents a viable opportunity in an underserved market. Strong unit economics and a scalable model make it a good candidate for seed funding after customer validation."
    }, null, 2);
  }

  // 13. Report Group 1
  if (lower.includes("group1schema") || (lower.includes("executivesummary") && lower.includes("onepagebrief") && lower.includes("opportunityanalysis"))) {
    return JSON.stringify({
      executiveSummary: { title: "Executive Summary", sections: { opportunity: ["Strong addressable market with underserved customers"], market: ["Growing at 18.5% annually with digital adoption"], competition: ["Fragmented — no dominant low-cost leader"], risk: ["Medium adoption risk; manageable with pilot validation"], financials: ["72% gross margin, 9:1 LTV:CAC ratio"], verdict: ["Proceed with customer discovery and pilot validation"] } },
      onePageBrief: { title: "One Page Brief", summary: "Scalable subscription solution for an underserved business segment with strong unit economics.", keyMetrics: [{ label: "Market Growth", value: "18.5%" }, { label: "Gross Margin", value: "72%" }, { label: "LTV:CAC", value: "9:1" }], recommendedActions: ["Customer discovery interviews", "5-customer pilot", "Define success KPIs"] },
      opportunityAnalysis: { title: "Opportunity Analysis", overallScore: 68, breakdown: { marketOpportunityScore: 72, competitionScore: 60, financialViabilityScore: 70, executionFeasibilityScore: 68, fundingPotentialScore: 62, riskResilienceScore: 65 }, keyFindings: ["Unserved mid-market segment identified", "Strong gross margin potential"] }
    }, null, 2);
  }

  // 14. Report Group 2
  if (lower.includes("group2schema") || (lower.includes("businessplan") && lower.includes("founderroadmap"))) {
    return JSON.stringify({
      businessPlan: { title: "Business Plan", sections: { problem: ["Target customers rely on manual or fragmented solutions that are costly"], solution: ["Purpose-built platform automating the core workflow"], market: ["TAM $45M | SAM $12M | SOM $1.5M"], businessModel: ["Subscription SaaS with tiered plans"], competition: ["No dominant low-cost leader in niche"], financials: ["Break-even month 14, 9:1 LTV:CAC"], roadmap: ["MVP Q1, pilot Q2, paid customers Q3, seed Q4"], risk: ["Market adoption speed; mitigated by structured discovery"], funding: ["$250K SAFE at $1.2M cap"] } },
      founderRoadmap: { title: "Founder Roadmap", sections: { plan30Day: ["15 customer interviews", "Finalize MVP scope"], plan90Day: ["Launch MVP", "5 pilot users", "Iterate on feedback"], plan1Year: ["25+ paying customers", "Seed closed", "5-person team"], milestones: ["First paying customer", "Seed funding close", "$10K MRR"], kpis: ["Conversion rate", "Churn rate", "NPS"], riskMitigation: ["Weekly customer feedback loops", "Monthly burn rate review"] } }
    }, null, 2);
  }

  // 15. Report Group 3
  if (lower.includes("group3schema") || (lower.includes("investorreport") && lower.includes("charts"))) {
    return JSON.stringify({
      investorReport: { title: "Investor Due Diligence", sections: { marketAnalysis: ["18.5% CAGR with $45M TAM"], tamSamSom: ["TAM: $45M | SAM: $12M | SOM: $1.5M"], competition: ["Fragmented market, no dominant low-cost provider"], moat: ["Network effects and domain-specific data accumulation"], financialViability: ["72% gross margin, 9:1 LTV:CAC"], investmentRecommendation: ["Suitable for seed-stage angels and micro-VCs"], redFlags: ["Early stage — structured pilot validation required"] } },
      charts: { marketGrowth: [{ label: "Y1", value: 10 }, { label: "Y2", value: 20 }, { label: "Y3", value: 35 }], revenueForecast: [{ label: "Y1", value: 120000 }, { label: "Y2", value: 350000 }, { label: "Y3", value: 800000 }], costBreakdown: [{ label: "Product", value: 45 }, { label: "Sales", value: 35 }, { label: "Ops", value: 20 }], riskMatrix: [{ x: 2, y: 3, label: "Market Adoption", severity: "Medium" }], competitorMatrix: [{ name: "Market Leader", criteria: ["Price", "Features"], score: 75 }], roadmapTimeline: [{ task: "Discovery", startMonth: 1, endMonth: 1, phase: "Phase 1" }, { task: "MVP", startMonth: 2, endMonth: 3, phase: "Phase 1" }, { task: "Pilot", startMonth: 4, endMonth: 6, phase: "Phase 2" }, { task: "Growth", startMonth: 7, endMonth: 9, phase: "Phase 3" }] }
    }, null, 2);
  }

  // 16. Report Group 4 / Pitch Deck
  if (lower.includes("group4schema") || (lower.includes("pitchdeck") && lower.includes("slidenumber"))) {
    return JSON.stringify({
      pitchDeck: [
        { slideNumber: 1, title: "Title", headline: "A Scalable Solution for an Underserved Market", points: ["Built for the customers no one else serves well"] },
        { slideNumber: 2, title: "The Problem", headline: "Existing solutions are too expensive and too generic for this segment", points: ["Manual workarounds waste time", "No purpose-built affordable option exists"] },
        { slideNumber: 3, title: "The Solution", headline: "An easy-to-use platform delivering immediate, measurable ROI", points: ["Automates the core workflow", "Integrates with existing tools", "Delivers measurable results"] },
        { slideNumber: 4, title: "Market Opportunity", headline: "$45M TAM growing at 18.5% annually", points: ["$12M SAM in our primary reachable segment", "$1.5M SOM achievable by Year 2"] },
        { slideNumber: 5, title: "Business Model", headline: "Subscription SaaS with strong unit economics", points: ["72% gross margin", "9:1 LTV:CAC ratio", "14-month payback period"] },
        { slideNumber: 6, title: "Technology", headline: "Purpose-built — not a generic platform", points: ["Domain-specific features", "Scalable cloud architecture", "AI-assisted workflow automation"] },
        { slideNumber: 7, title: "Competition", headline: "Fragmented market — no dominant low-cost leader", points: ["Incumbents are slow and overpriced", "First-mover advantage available in our niche"] },
        { slideNumber: 8, title: "Go-to-Market", headline: "Content-led inbound + targeted outbound sales motion", points: ["Initial vertical focus for efficiency", "Land-and-expand account model", "Expand via referrals and partnerships"] },
        { slideNumber: 9, title: "Financials", headline: "Break-even in 14 months on $250K seed investment", points: ["Year 1: $120K revenue", "Year 3: $800K revenue", "Strong path to profitability"] },
        { slideNumber: 10, title: "Risks & Mitigation", headline: "Identified risks are manageable with structured approach", points: ["Market adoption risk mitigated by pilot validation", "Competition risk mitigated by niche focus"] },
        { slideNumber: 11, title: "Team & Funding", headline: "Seeking $250K SAFE at $1.2M cap", points: ["Use of funds: 45% product, 35% growth, 20% ops", "12 months runway to key milestones"] },
        { slideNumber: 12, title: "Conclusion", headline: "A real market, strong economics, and the right team to execute", points: ["Next step: 15 customer interviews + pilot launch", "Join us in building the category leader"] }
      ]
    }, null, 2);
  }

  // 17. Opportunity Context Schema
  if (lower.includes("opportunitycontextschema") || lower.includes("venturecontextschema") || (lower.includes("intent") && lower.includes("goal") && lower.includes("startup_idea"))) {
    return JSON.stringify({
      intent: "VALIDATE_IDEA",
      goal: "Validate the viability of the startup concept and identify key risks and opportunities",
      secondary_goals: ["Understand competitive landscape", "Identify potential customers"],
      resources: ["Domain expertise", "Initial seed capital"],
      skills: ["Product development", "Customer discovery"],
      constraints: ["Limited initial capital", "Small founding team"],
      location: { country: "unknown", state: "unknown", district: "unknown", city: "unknown", village: "unknown", region: "unknown", location_status: "MISSING" },
      financial_context: { budget: "unknown", available_capital: "unknown", revenue: "unknown", profit: "unknown", funding_stage: "pre-seed" },
      timeline: "12-18 months",
      existing_business: { description: "none", industry: "none", years_active: "none" },
      startup_idea: { description: "A technology-enabled solution targeting an underserved business segment", target_audience: "Small and medium businesses", value_proposition: "Saves time and reduces cost through automation" },
      critical_missing_information: ["Specific market size data", "Competitor pricing details"],
      confidence: { intent: "MEDIUM", goal: "MEDIUM", resources: "LOW", skills: "LOW", constraints: "LOW", location: "LOW", financial_context: "LOW", timeline: "LOW", existing_business: "LOW", startup_idea: "MEDIUM" },
      reasoning: "Processed via fallback due to LLM quota exhaustion. Core concept extracted from user input."
    }, null, 2);
  }

  if (lower.includes("json") || lower.includes("schema") || lower.includes("structure")) { return "{}"; }
  return "Successfully processed pipeline step using local mock fallback resource.";
}

// Query local Ollama API with retry logic
async function queryOllama(prompt: string, isStructured: boolean = false, retries: number = 3): Promise<string> {
  const model = process.env.OLLAMA_MODEL || "llama3.1:8b";
  const url = process.env.OLLAMA_HOST || "http://127.0.0.1:11434/api/generate";

  const body: Record<string, any> = {
    model: model,
    prompt: prompt,
    stream: false,
    // Disable Qwen 3's "thinking" mode (must be top-level, NOT inside options)
    think: false,
    options: {
      temperature: 0.2,
    }
  };

  if (isStructured) {
    body.format = "json";
  }

  let attempt = 0;
  let delay = 2000;

  while (attempt < retries) {
    try {
      console.log(`[Ollama Client] Requesting ${model} at ${url} (Structured JSON: ${isStructured}) (Attempt ${attempt + 1}/${retries})`);
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Ollama API returned status ${response.status}: ${errText}`);
      }

      const data = await response.json();
      let text = data.response;

      // Debug: log the raw response keys to diagnose empty response issues
      if (!text) {
        console.warn(`[Ollama Client] Empty 'response' field. Raw keys: ${JSON.stringify(Object.keys(data))}. done=${data.done}, model=${data.model}`);
        // Some thinking models put content in data.message.content (chat format)
        if (data.message?.content) {
          text = data.message.content;
        }
      }

      if (!text) {
        throw new Error("Empty response returned from Ollama API");
      }
      // Strip any residual <think>...</think> blocks from Qwen 3 models
      text = text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
      if (!text) {
        throw new Error("Response was empty after stripping thinking blocks");
      }
      return text;
    } catch (error: any) {
      attempt++;
      console.warn(`[Ollama Client] Request failed: ${error.message || error}. Attempt ${attempt}/${retries}`);
      if (attempt >= retries) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 1.5;
    }
  }
  throw new Error("Ollama request failed after max retries");
}

// Helper to scan matching JSON brackets/braces to handle nested structures
function findMatchingBrace(text: string, startIdx: number): number {
  const startChar = text[startIdx];
  const endChar = startChar === "{" ? "}" : "]";
  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = startIdx; i < text.length; i++) {
    const c = text[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (c === "\\") {
      escape = true;
      continue;
    }
    if (c === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (c === startChar) {
        depth++;
      } else if (c === endChar) {
        depth--;
        if (depth === 0) {
          return i;
        }
      }
    }
  }
  return -1;
}

// Helper to recursively prune parsed JSON data structures to safe sizes
function pruneObject(obj: any): any {
  if (obj === null || obj === undefined) return obj;

  if (Array.isArray(obj)) {
    const maxItems = 10;
    const sliced = obj.slice(0, maxItems);
    return sliced.map(item => pruneObject(item));
  }

  if (typeof obj === "object") {
    const pruned: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      pruned[key] = pruneObject(obj[key]);
    }
    return pruned;
  }

  if (typeof obj === "string") {
    if (obj.length > 1000) {
      return obj.substring(0, 1000) + "... [truncated due to context limit]";
    }
  }

  return obj;
}

// Parse and clean serialized JSON objects within prompt contents to stay inside limits
function extractAndPruneJson(text: string): string {
  let pos = 0;
  let modifiedText = text;
  
  while (true) {
    const startIdx = modifiedText.indexOf(":", pos);
    if (startIdx === -1) break;

    let jsonStart = startIdx + 1;
    while (jsonStart < modifiedText.length && /\s/.test(modifiedText[jsonStart])) {
      jsonStart++;
    }

    if (jsonStart >= modifiedText.length) break;

    const char = modifiedText[jsonStart];
    if (char === "{" || char === "[") {
      const endIdx = findMatchingBrace(modifiedText, jsonStart);
      if (endIdx !== -1) {
        const jsonStr = modifiedText.substring(jsonStart, endIdx + 1);
        try {
          const parsed = JSON.parse(jsonStr);
          const prunedParsed = pruneObject(parsed);
          const newJsonStr = JSON.stringify(prunedParsed, null, 2);

          modifiedText = modifiedText.substring(0, jsonStart) + newJsonStr + modifiedText.substring(endIdx + 1);
          pos = jsonStart + newJsonStr.length;
          continue;
        } catch (e) {
          // Not valid JSON, skip
        }
      }
    }
    pos = startIdx + 1;
  }
  return modifiedText;
}

// Main context/state pruner function
function prunePrompt(prompt: string): string {
  if (prompt.length < 20000) {
    return prompt;
  }
  try {
    console.log(`[LLM Context Maintenance] Prompt length is ${prompt.length} characters. Pruning to fit context window...`);
    const pruned = extractAndPruneJson(prompt);
    console.log(`[LLM Context Maintenance] Pruning complete. New length: ${pruned.length} characters.`);
    return pruned;
  } catch (err) {
    console.warn(`[LLM Context Maintenance] Pruning failed:`, err);
    return prompt;
  }
}

// Resolve LLM call dynamically based on provider availability
async function resolveLlmCall(
  input: string | { role: string; content: string }[],
  isStructured: boolean = false
): Promise<string> {
  const keys = apiKeyStorage.getStore();
  const userGeminiKey = typeof keys === "object" ? keys?.geminiApiKey : undefined;
  const userCfToken = typeof keys === "object" ? keys?.cloudflareApiToken : undefined;
  const userCfAccount = typeof keys === "object" ? keys?.cloudflareAccountId : undefined;

  const geminiApiKey = (userGeminiKey || process.env.GEMINI_API_KEY || "").trim();
  const cloudflareApiToken = (userCfToken || process.env.CLOUDFLARE_API || "").trim();
  const cloudflareAccountId = (userCfAccount || process.env.CLOUDFLARE_ACCOUNT_ID || "").trim();
  const cloudflareModel = process.env.CLOUDFLARE_LLM_MODEL || "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

  // Construct standard messages format
  let messages: { role: string; content: string }[] = [];
  if (typeof input === "string") {
    messages = [{ role: "user", content: input }];
  } else if (Array.isArray(input)) {
    messages = input.map((m: any) => {
      const content = m.content || m.text || JSON.stringify(m);
      return {
        role: m.role || m._type || "user",
        content: content
      };
    });
  } else if (input && typeof input === "object") {
    const content = (input as any).content || JSON.stringify(input);
    messages = [{ role: "user", content: content }];
  }

  // Classify if this is a Premium-tier (Tier 2) agent call based on prompt context keywords
  const promptText = messages.map(m => m.content).join(" ").toLowerCase();
  const isPremiumAgent = 
    promptText.includes("venture analyst") || 
    promptText.includes("founder roadmap") || 
    promptText.includes("decision engine") || 
    promptText.includes("report generation") ||
    promptText.includes("pitch deck") ||
    promptText.includes("investment recommendation");

  // Partition logic:
  // - Premium agents (Tier 2) run strictly on Gemini (Google) with mock fallback.
  // - Free agents (Tier 1) run on Cloudflare (Llama 3.3) but fall back to Gemini to prevent free limit exhaustion, and then to mock.
  const providers = isPremiumAgent
    ? ["gemini", "mock"]
    : ["cloudflare", "gemini", "mock"];
  
  console.log(`[LLM] Call classified as: ${isPremiumAgent ? "Premium-Tier (Tier 2)" : "Free-Tier (Tier 1)"} | Chain: [${providers.join(" → ")}]`);
  let generatedText = "";

  for (const provider of providers) {
    if (provider === "cloudflare" && cloudflareApiToken && cloudflareAccountId) {
      if (cloudflareQuotaExhausted) {
        console.log(`[LLM] Cloudflare quota exhausted this session — skipping directly to next provider.`);
      } else {
        try {
          console.log(`[LLM${isStructured ? ' Structured' : ''}] Querying Cloudflare Workers AI (Llama 3.3)...`);
          generatedText = await queryCloudflare(messages, cloudflareApiToken, cloudflareAccountId, cloudflareModel);
          if (generatedText) {
            if (isStructured) {
              try {
                let cleaned = (typeof generatedText === "string" ? generatedText : String(generatedText || "")).trim();
                if (cleaned.startsWith("```")) {
                  cleaned = cleaned.replace(/^```(json)?\n?/, "");
                }
                if (cleaned.endsWith("```")) {
                  cleaned = cleaned.substring(0, cleaned.length - 3);
                }
                cleaned = cleaned.trim();
                JSON.parse(cleaned);
                break; // Valid JSON!
              } catch (jsonErr: any) {
                console.warn(`[LLM Structured] Cloudflare output is not valid JSON. Trying next provider... Error: ${jsonErr.message}`);
              }
            } else {
              break;
            }
          }
        } catch (cfError: any) {
          const cfErrMsg = cfError.message || String(cfError);
          if (cfErrMsg.includes("429") || cfErrMsg.includes("neurons") || cfErrMsg.includes("allocation")) {
            console.warn(`[LLM] Cloudflare quota exhausted (429). Permanently skipping Cloudflare for this session.`);
            cloudflareQuotaExhausted = true;
          } else {
            console.warn(`[LLM${isStructured ? ' Structured' : ''}] Cloudflare Workers AI failed: ${cfErrMsg}. Trying next provider...`);
          }
        }
      }
    }

    if (provider === "gemini" && geminiApiKey && geminiApiKey !== "placeholder-key-for-build") {
      // Retry Gemini up to 3 times for 429 rate-limit errors using the response-specified delay
      let geminiSuccess = false;
      for (let geminiAttempt = 0; geminiAttempt < 3 && !geminiSuccess; geminiAttempt++) {
        try {
          if (geminiAttempt > 0) {
            console.log(`[LLM] Gemini retry attempt ${geminiAttempt + 1}/3...`);
          } else {
            console.log(`[LLM${isStructured ? ' Structured' : ''}] Querying Google Gemini API...`);
          }
          const prompt = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n");
          generatedText = await queryGemini(prompt, geminiApiKey);
          if (generatedText) {
            if (isStructured) {
              try {
                let cleaned = (typeof generatedText === "string" ? generatedText : String(generatedText || "")).trim();
                if (cleaned.startsWith("```")) {
                  cleaned = cleaned.replace(/^```(json)?\n?/, "");
                }
                if (cleaned.endsWith("```")) {
                  cleaned = cleaned.substring(0, cleaned.length - 3);
                }
                cleaned = cleaned.trim();
                JSON.parse(cleaned);
                geminiSuccess = true;
                break; // Valid JSON!
              } catch (jsonErr: any) {
                console.warn(`[LLM Structured] Gemini output is not valid JSON. Error: ${jsonErr.message}`);
                geminiSuccess = true; // Don't retry JSON parse issues — move to next provider
              }
            } else {
              geminiSuccess = true;
              break;
            }
          }
        } catch (geminiError: any) {
          const geminiErrMsg = geminiError.message || String(geminiError);
          // Check if it's a rate limit error with a retryDelay hint
          if (geminiErrMsg.includes("429") || geminiErrMsg.includes("RESOURCE_EXHAUSTED")) {
            // Parse the retry delay from the error message (e.g., "Please retry in 5.087s")
            const delayMatch = geminiErrMsg.match(/retry in (\d+(?:\.\d+)?)s/i);
            const retryDelaySec = delayMatch ? Math.min(parseFloat(delayMatch[1]) + 1, 15) : 6;
            if (geminiAttempt < 2) {
              console.warn(`[LLM] Gemini 429 rate limit — waiting ${retryDelaySec}s before retry ${geminiAttempt + 2}/3...`);
              await sleep(retryDelaySec * 1000);
            } else {
              console.warn(`[LLM${isStructured ? ' Structured' : ''}] Google Gemini exhausted after 3 attempts (429 quota). Trying next provider...`);
            }
          } else {
            // Non-rate-limit error — don't retry
            console.warn(`[LLM${isStructured ? ' Structured' : ''}] Google Gemini failed: ${geminiErrMsg.substring(0, 200)}. Key: ${geminiApiKey.substring(0, 5)}...${geminiApiKey.substring(geminiApiKey.length - 5)}. Trying next provider...`);
            break; // Exit the inner retry loop
          }
        }
      }
      if (geminiSuccess) break; // Gemini worked — exit provider loop
    }

    if (provider === "ollama") {
      try {
        console.log(`[LLM${isStructured ? ' Structured' : ''}] Querying local Ollama (${process.env.OLLAMA_MODEL || 'llama3.1:8b'})...`);
        const prompt = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n");
        generatedText = await queryOllama(prompt, isStructured);
        if (generatedText) {
          if (isStructured) {
            try {
              let cleaned = (typeof generatedText === "string" ? generatedText : String(generatedText || "")).trim();
              if (cleaned.startsWith("```")) {
                cleaned = cleaned.replace(/^```(json)?\n?/, "");
              }
              if (cleaned.endsWith("```")) {
                cleaned = cleaned.substring(0, cleaned.length - 3);
              }
              cleaned = cleaned.trim();
              JSON.parse(cleaned);
              break; // Valid JSON!
            } catch (jsonErr: any) {
              console.warn(`[LLM Structured] Ollama output is not valid JSON. Trying next provider... Error: ${jsonErr.message}`);
            }
          } else {
            break;
          }
        }
      } catch (ollamaError: any) {
        console.warn(`[LLM${isStructured ? ' Structured' : ''}] Local Ollama failed: ${ollamaError.message || ollamaError}. Trying next provider...`);
      }
    }

    if (provider === "mock") {
      console.log(`[LLM${isStructured ? ' Structured' : ''}] Querying Mock Fallback...`);
      const prompt = messages.map(m => m.content).join("\n");
      generatedText = queryMock(prompt);
      break;
    }
  }

  if (!generatedText) {
    throw new Error("All LLM providers (Cloudflare, Gemini, Ollama) returned empty response and no mock fallback worked.");
  }

  return generatedText;
}

// A Proxy wrapper that intercepts all method calls and properties
// to mimic a LangChain ChatGoogleGenerativeAI instance.
export const llm = new Proxy({} as ChatGoogleGenerativeAI, {
  get(target, prop, receiver) {
    if (prop === "invoke") {
      return async function (input: any, options?: any) {
        console.log(`[LLM Throttle] Sleeping for ${THROTTLE_DELAY_MS}ms before invoke...`);
        await sleep(THROTTLE_DELAY_MS);

        let prunedInput: any;
        if (typeof input === "string") {
          prunedInput = prunePrompt(input);
        } else if (Array.isArray(input)) {
          prunedInput = input.map((m: any) => ({
            ...m,
            content: prunePrompt(m.content || m.text || JSON.stringify(m))
          }));
        } else if (input && typeof input === "object") {
          prunedInput = {
            ...input,
            content: prunePrompt(input.content || JSON.stringify(input))
          };
        } else {
          prunedInput = input;
        }

        const generatedText = await resolveLlmCall(prunedInput, false);

        return {
          content: generatedText,
          toString() {
            return generatedText;
          }
        };
      };
    }

    if (prop === "withStructuredOutput") {
      return function (schema: any) {
        return {
          invoke: async function (input: any, options?: any) {
            const schemaStr = JSON.stringify(schema, null, 2);
            const instructions = `\n\nIMPORTANT: You must respond ONLY with a raw JSON object matching the schema below. Do not wrap the response in markdown code blocks (such as \`\`\`json ... \`\`\`), do not include any explanatory text, introduction, or notes. Ensure the output is valid JSON.\n\nJSON Schema structure:\n${schemaStr}\n\nJSON Response:`;

            let enhancedInput: any;
            if (typeof input === "string") {
              enhancedInput = prunePrompt(input) + instructions;
            } else if (Array.isArray(input)) {
              enhancedInput = [...input];
              const lastMsg = enhancedInput[enhancedInput.length - 1];
              if (lastMsg && typeof lastMsg === "object") {
                const existingContent = lastMsg.content || lastMsg.text || "";
                enhancedInput[enhancedInput.length - 1] = {
                  ...lastMsg,
                  content: prunePrompt(existingContent) + instructions
                };
              } else {
                enhancedInput.push({ role: "user", content: instructions });
              }
            } else if (input && typeof input === "object") {
              enhancedInput = {
                ...input,
                content: prunePrompt(input.content || "") + instructions
              };
            } else {
              enhancedInput = instructions;
            }

            console.log(`[LLM Throttle] Sleeping for ${THROTTLE_DELAY_MS}ms before structured output invoke...`);
            await sleep(THROTTLE_DELAY_MS);

            const generatedText = await resolveLlmCall(enhancedInput, true);

            let cleaned = typeof generatedText === "string" ? generatedText.trim() : String(generatedText || "").trim();
            if (cleaned.startsWith("```")) {
              cleaned = cleaned.replace(/^```(json)?\n?/, "");
            }
            if (cleaned.endsWith("```")) {
              cleaned = cleaned.substring(0, cleaned.length - 3);
            }
            cleaned = cleaned.trim();

            try {
              return JSON.parse(cleaned);
            } catch (err: any) {
              console.error(`Failed to parse structured LLM output: ${err.message}. Raw text: ${cleaned}`);
              throw new Error(`JSON parsing failed: ${err.message}`);
            }
          }
        };
      };
    }

    return Reflect.get(target, prop, receiver);
  }
});

/**
 * BUG-H FIX: Lightweight LLM invoke that skips the 1500ms throttle.
 * Use ONLY for short, low-stakes utility calls (e.g. query expansion, classification)
 * where throttling would add invisible latency with no benefit.
 * DO NOT use for main agent structured-output calls — those need throttling to
 * avoid rate-limit errors on Cloudflare/Gemini.
 */
export async function llmInvokeFast(prompt: string): Promise<string> {
  try {
    const result = await resolveLlmCall(prompt, false);
    return result;
  } catch (err: any) {
    console.error("[llmInvokeFast] Failed:", err.message);
    return "";
  }
}