// lib/graph/decision/examples.ts
import { VentureDecisionReport } from "./types";

export const MOCK_DECISION_REPORT: VentureDecisionReport = {
  "opportunityScore": {
    "score": 0, // Computed programmatically by the engine
    "breakdown": {
      "marketOpportunityScore": 85,
      "competitionScore": 65,
      "financialViabilityScore": 80,
      "executionFeasibilityScore": 70,
      "fundingPotentialScore": 75,
      "riskResilienceScore": 72
    }
  },
  "investorReadiness": {
    "score": 78,
    "reasoning": [
      "Extremely healthy unit economics with a projected B2B SaaS LTV:CAC ratio exceeding 20x.",
      "Clear customer pain points identified around charging delays in Pune logistics corridors.",
      "Lacks utility patent protection, but software-first algorithm acts as a process-driven moat."
    ]
  },
  "executionReadiness": {
    "score": 74,
    "reasoning": [
      "Founder has strong local connections with Pune fleet operators but lacks embedded systems software co-founders.",
      "Initial ₹2 Lakhs capital is highly restrictive, preventing any immediate hardware charging station purchases.",
      "Clear, topologically sorted 5-phase validation roadmap is set up to de-risk key assumptions."
    ]
  },
  "ventureReadiness": {
    "stage": "VALIDATED",
    "score": 72
  },
  "confidence": {
    "score": 82, // Calculated programmatically by the engine
    "reasoning": [
      "Direct alignment with localized Maharashtra State Electricity Distribution (MSEDCL) load balancing requirements.",
      "Strong consensus across 14 validated facts with no critical source conflicts."
    ]
  },
  "verdict": {
    "decision": "PROCEED WITH CAUTION",
    "reasoning": [
      "Venture represents a strong software-first value proposition avoiding capital-heavy hardware acquisitions.",
      "₹2 Lakhs capital constraint limits initial operational runway and early hardware pilot testing.",
      "Dominant charging networks (Tata Power, Ather Grid) hold prime real estate sites, requiring software optimization partnerships rather than direct competition."
    ]
  },
  "topOpportunities": [
    "Surging B2B electrification in Pune's Chakan and Bhosari industrial shipping corridors.",
    "Grid load balancing software avoids heavy capital expenditures on physical grid transformers.",
    "Maharashtra State EV Policy offers subsidy incentives for smart load management integrations.",
    "Fragmented regional charging stations create demand for a unified SaaS aggregator dashboard.",
    "High scalability of a software-only broker model to Mumbai and other Tier-1 metros."
  ],
  "topRisks": [
    "Strict ₹2 Lakhs initial setup budget severely limits engineering runway.",
    "Ather Grid and Tata Power command massive pre-existing real estate advantages at prime charging spots.",
    "High reliance on third-party electricity grid distribution reliability and local MSEDCL policies.",
    "Fragmented OCPP implementations across cheaper charging hardware manufacturers.",
    "Reluctance of cost-sensitive Pune e-rickshaw operators to adopt subscription billing."
  ],
  "recommendedActions": [
    "Launch the load-saving ROI calculator on the website landing page to collect fleet lead generation data.",
    "Interview 30 Pune e-rickshaw cooperative members to map local transport hubs.",
    "Develop a grid load balancing firmware simulator dashboard to prove peak demand reduction.",
    "Apply for Maharashtra state green-tech grants and Startup India Seed Fund Scheme (SISFS)."
  ],
  "executiveSummary": "VentureIQ has completed its strategic investment assessment for the Pune EV Charging Network opportunity. The venture represents a PROCEED WITH CAUTION opportunity (Venture Readiness Score: 72/100). The Opportunity Score of 77 is driven by exceptionally strong market growth and clean SaaS unit economics, but is constrained by the founder's ₹2 Lakhs validation budget which prevents hardware acquisition. Competitively, Ather Grid and Tata Power hold prime real estate sites, meaning VentureIQ must win by providing balancing software layer integrations rather than direct hardware station installations. Immediate priority is running a firmware simulation to prove peak load reduction before seeking external angel funding."
};
