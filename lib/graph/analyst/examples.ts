// lib/graph/analyst/examples.ts
import { VentureAnalystReport } from "./types";

export const MOCK_ANALYST_REPORT: VentureAnalystReport = {
  marketAttractiveness: {
    marketSizeScore: 88,
    marketGrowthScore: 92,
    demandScore: 85,
    expansionPotentialScore: 80,
    timingScore: 90,
    overallScore: 87,
    reasoning: "The EV charging infrastructure and software market in India is expanding at a 49% CAGR, representing massive growth potential. Timing is optimal due to local government mandates."
  },
  scalability: {
    operationalScalability: "Highly scalable pure SaaS architecture with cloud deployment, though localized charge point hardware testing requires local field support.",
    financialScalability: "SaaS margins exceeding 75% allow high operating leverage as connection density scales.",
    technologyScalability: "Standardized OCPP integration enables immediate plug-and-play scaling across different charging hardware manufacturers.",
    localScalabilityScore: 90,
    nationalScalabilityScore: 80,
    globalScalabilityScore: 65
  },
  defensibility: {
    technologyAdvantage: "Proprietary grid load optimization and charger scheduling algorithms.",
    dataMoat: "Accumulated transaction patterns and charger usage profiles.",
    networkEffects: "High charger density on the platform attracts more fleet operators, creating a convenience loop.",
    distributionPower: "Pre-existing relationships with delivery fleet operators in Pune.",
    brandEquity: "Early stage with zero institutional brand awareness.",
    partnerships: "Hardware agreements with local charging manufacturers.",
    regulatoryAdvantages: "Pre-certified compliance with grid utilities."
  },
  moatAnalysis: {
    identifiedMoats: ["Proprietary grid load balancing algorithm", "Fleet transaction data network"],
    moatStrengthScore: 72,
    sustainabilityScore: 78,
    replicabilityDifficulty: "Replicating the load balancing engine requires deep grid utility API and power factor calibration engineering."
  },
  timingAnalysis: {
    score: 90,
    rationale: "Electrification of commercial delivery fleets is scaling exponentially due to immediate fuel cost savings and FAME subsidies. The charging software market is in its optimal entry window.",
    timingStage: "OPTIMAL"
  },
  fundingPotential: {
    angelSuitabilityScore: 90,
    seedSuitabilityScore: 85,
    vcSuitabilityScore: 75,
    grantSuitabilityScore: 70,
    bootstrapSuitabilityScore: 60,
    overallScore: 80,
    reasoning: "Excellent fit for seed-stage climate-tech and mobility funds. Grants are also viable from regional green transition councils."
  },
  exitPotential: {
    acquisitionOpportunities: ["Acquisition by oil & gas conglomerates expanding to EV", "Acquisition by logistics SaaS networks"],
    strategicBuyers: ["Tata Power", "Ather Energy", "Reliance Jio-BP", "Adani Total Gas"],
    ipoPotentialScore: 65,
    exitTimelineYears: 6
  },
  ventureReadiness: {
    customerValidationScore: 60,
    marketValidationScore: 80,
    financialReadinessScore: 70,
    executionReadinessScore: 75,
    fundraisingReadinessScore: 65,
    score: 70,
    reasoning: "Venture shows strong regulatory mapping and unit economic viability, but lacks execution track record and is limited by initial starting budget constraints."
  },
  redFlags: [
    "Strict ₹2 Lakhs initial budget constraint severely limits runway and early hardware testing capacity.",
    "Ather Grid and Tata Power command massive pre-existing real estate advantages at prime charging spots.",
    "High reliance on third-party electricity grid distribution reliability and local DISCOM policies."
  ],
  investmentRecommendation: {
    decision: "YES",
    confidence: 78,
    reasoning: [
      "Extremely healthy unit economics with a projected LTV:CAC of 20x.",
      "Optimal entry timing aligning with massive fleet electrification cycles.",
      "Clear software-first value proposition avoiding capital-heavy hardware acquisitions."
    ],
    requiredMilestones: [
      "Validate initial charging telemetry software with at least 5 charge points under a live pilot.",
      "Deploy fallback status caching to handle grid latency or dropouts."
    ]
  }
};
export const MOCK_ANALYSIS_COMPATIBILITY = {
  readinessScore: 70,
  verdict: "Proceed",
  strengths: [
    "Extremely healthy unit economics with a projected LTV:CAC of 20x.",
    "Optimal entry timing aligning with massive fleet electrification cycles."
  ],
  weaknesses: [
    "Strict ₹2 Lakhs initial budget constraint limits runway.",
    "Incumbents control prime physical charging locations."
  ],
  opportunities: [
    "Commercial delivery fleet electrification scaling rapidly.",
    "SaaS integration overlay avoids capital-heavy hardware costs."
  ],
  threats: [
    "Maharashtra electricity tariff or regulatory revisions.",
    "Charger sync dropouts or server infrastructure latency."
  ],
  financialProjection: "Estimated break-even in Month 11 withMRR crossover. Expected seed round capital required: $150K."
};
export const MOCK_COMBINED_REPORT = {
  ...MOCK_ANALYST_REPORT,
  ...MOCK_ANALYSIS_COMPATIBILITY
};
