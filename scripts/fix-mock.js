const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'lib', 'graph', 'llm.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Find the start of the queryMock function
const startMarker = '// Generate simple mock fallback response';
const endMarker = '// Query local Ollama API';

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker, startIdx);

if (startIdx === -1 || endIdx === -1) {
  console.error('Could not find mock function boundaries!');
  console.log('startIdx:', startIdx, 'endIdx:', endIdx);
  process.exit(1);
}

console.log('Found mock function: lines', content.substring(0, startIdx).split('\n').length, '-', content.substring(0, endIdx).split('\n').length);

const newMock = `// Generate simple mock fallback response
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

`;

const before = content.substring(0, startIdx);
const after = content.substring(endIdx);
const newContent = before + newMock + after;

fs.writeFileSync(filePath, newContent, 'utf8');
console.log('✅ queryMock function replaced successfully!');
console.log('New file size:', newContent.length, 'bytes (was', content.length, 'bytes)');
