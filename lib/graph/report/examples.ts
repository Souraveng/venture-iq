// lib/graph/report/examples.ts
import { VentureReportsContainer } from "./types";

export const MOCK_REPORTS_CONTAINER: VentureReportsContainer = {
  executiveSummary: {
    title: "Executive Summary: Smart EV Fleet Electrification",
    sections: {
      opportunity: [
        "Developing an asset-light, software-only OCPP charging grid load balancing aggregator in Pune, India.",
        "Addresses critical operational grid overloads and fleet queue times while remaining within a ₹2 Lakhs initial budget."
      ],
      market: [
        "Hyper-growth commercial EV logistics sector in Maharashtra industrial hubs (Chakan, Bhosari).",
        "TAM estimated at ₹1,500 Crore, SAM at ₹180 Crore, and SOM at ₹4.2 Crore."
      ],
      competition: [
        "Ather Grid and Tata Power command dominant prime real estate positions for charging infrastructure.",
        "Our platform plays an aggregative software-only brokerage role rather than deploying expensive physical chargers."
      ],
      risk: [
        "High dependency on local electricity distributor (MSEDCL) smart grid policies and substation capacity limits.",
        "Operator friction: cost-conscious Pune e-rickshaw fleets may resist recurring subscription billing models."
      ],
      financials: [
        "Projected Year 1 ARR of $142,000, scaling to $1.42M by Year 3.",
        "Operational break-even achieved by Month 11 with 50 paid fleet contracts."
      ],
      verdict: [
        "Overall decision is PROCEED WITH CAUTION, conditional on immediate pilot validation.",
        "Recommended next step is onboarding 5 logistics partners for a 2-week peak load optimization trial."
      ]
    }
  },
  businessPlan: {
    title: "Business Plan: EV Fleet OS",
    sections: {
      problem: [
        "Pune fleet operators lose up to 18% daily utilization to charging station queues.",
        "Simultaneous fast charging exceeds utility transformer limits, causing grid blackouts."
      ],
      solution: [
        "Dynamic charging scheduling and OCPP-based electrical load balancing.",
        "Unified fleet management software dashboard showing real-time charger statuses."
      ],
      market: [
        "Targeting 5,000 commercial e-rickshaws and last-mile delivery fleets in Pune.",
        "Maharashtra state mandates 100% last-mile delivery electrification by 2030."
      ],
      businessModel: [
        "SaaS Subscription: ₹1,500/vehicle/month for fleet load optimization.",
        "Transaction fee: 2.5% processing fee on charging utility bills processed via the platform."
      ],
      competition: [
        "Hardware-first charging networks (Tata Power, Ather Grid) operate closed, capital-heavy loops.",
        "Our platform is hardware-agnostic, asset-light, and integrates with any OCPP 1.6/2.0 charger."
      ],
      financials: [
        "Low startup overhead (₹1.6 Lakhs expected) yields 84% gross margins.",
        "LTV:CAC ratio of 20x ensures rapid customer payback."
      ],
      roadmap: [
        "Month 1–3: Pune fleet operator discovery and landing page willingness-to-pay tests.",
        "Month 4–9: 5-vehicle validation pilot and OCPP simulator firmware release.",
        "Month 10–18: Commercial B2B SaaS launch targeting 50 fleet customer accounts."
      ],
      risk: [
        "Maharashtra DISCOM (MSEDCL) regulatory constraints on smart load shifting.",
        "Embedded OCPP engineering co-founder recruitment bottleneck."
      ],
      funding: [
        "Bootstrap validation using ₹2 Lakhs founder savings.",
        "Apply for Startup India Seed Fund Scheme (SISFS) for ₹20 Lakhs non-dilutive validation grants.",
        "Raise ₹50 Lakhs angel round for West India geographical expansion."
      ]
    }
  },
  investorReport: {
    title: "Investor Due Diligence Report: Pune Charging Orchestration",
    sections: {
      marketAnalysis: [
        "Pune commercial EV fleet counts are scaling at 32% CAGR.",
        "Substation grid limits are the primary operational bottleneck for fleet depot scaling."
      ],
      tamSamSom: [
        "TAM: ₹1,500 Crore (National EV fleet management software addressable market).",
        "SAM: ₹180 Crore (Maharashtra clean-tech fleet logistics software slice).",
        "SOM: ₹4.2 Crore (Initial 50 Pune B2B fleet logistics accounts)."
      ],
      competition: [
        "Ather Grid owns prime public spots but focuses on proprietary 2-wheeler charging.",
        "Tata Power has large physical footprints but lacks B2B fleet scheduling and load optimizations."
      ],
      moat: [
        "Proprietary load balancing algorithms optimizing electricity costs at the depot level.",
        "Unified OCPP firmware middleware enabling integrations with cheap local chargers."
      ],
      financialViability: [
        "High gross margins (84%) typical of pure B2B SaaS aggregators.",
        "Extremely low capital requirements for initial validation (within the ₹2 Lakhs limit)."
      ],
      investmentRecommendation: [
        "Decision: PROCEED WITH CAUTION. The software value proposition is strong but capital-constrained.",
        "Release angel funding only after pilot validation data confirms a >20% reduction in peak depot load."
      ],
      redFlags: [
        "Strict ₹2 Lakhs initial budget restricts early marketing and testing hardware purchases.",
        "High developer salary demands for embedded systems specialists in Pune hubs."
      ]
    }
  },
  founderRoadmap: {
    title: "Tactical Founder Roadmap",
    sections: {
      plan30Day: [
        "Interview 30 local Pune fleet operators to catalog charging schedule pain points.",
        "Launch simple landing page with electricity cost saving calculator to track lead generation."
      ],
      plan90Day: [
        "Develop core dynamic load balancer algorithm simulator.",
        "Deploy a 2-week live pilot with 5 commercial vehicles on third-party chargers."
      ],
      plan1Year: [
        "Transition the pilot software into a multi-tenant B2B SaaS dashboard.",
        "Secure first 20 paid B2B fleet logistics customer accounts at ₹1,500/vehicle/month."
      ],
      milestones: [
        "ms-1: Complete Customer Discovery (Month 3) - 30 interviews completed.",
        "ms-2: Live Pilot Telemetry Verification (Month 6) - 5 vehicles optimized.",
        "ms-3: SaaS Commercial Rollout (Month 10) - 20 paid accounts live."
      ],
      kpis: [
        "depot peak power draw reduction > 20% during charging cycles.",
        "customer onboarding duration < 3 business days.",
        "net promoter score (NPS) > 40."
      ],
      riskMitigation: [
        "Form software aggregation partnerships with charger owners to bypass land acquisition costs.",
        "Build offline telemetry caching firmware to handle cell network dropouts."
      ]
    }
  },
  pitchDeck: [
    {
      slideNumber: 1,
      title: "Cover",
      headline: "EV Fleet OS Pune",
      points: [
        "Orchestrating Smart B2B EV Fleet Charging",
        "Confidential Seed Round Pitch · 2026"
      ]
    },
    {
      slideNumber: 2,
      title: "Problem",
      headline: "The Depot Grid Bottleneck",
      points: [
        "60% of fleet operators suffer daily charging queue delays in Pune industrial zones.",
        "Simultaneous charger plug-ins overload utility transformers, causing local blackouts.",
        "Fragmented charger networks lack unified APIs and fleet status monitoring."
      ]
    },
    {
      slideNumber: 3,
      title: "Solution",
      headline: "Dynamic OCPP Charging Orchestration",
      points: [
        "Hardware-agnostic SaaS layer aggregating OCPP 1.6/2.0.1 chargers.",
        "Proprietary algorithms scheduling charge cycles to optimize grid loads.",
        "Reduces peak utility electricity demand charges by up to 30%."
      ]
    },
    {
      slideNumber: 4,
      title: "Market Context",
      headline: "Maharashtra's Commercial EV Surge",
      points: [
        "Last-mile delivery and e-rickshaw fleets are electrifying rapidly in Pune.",
        "Maharashtra state policy mandates 100% last-mile delivery electrification by 2030."
      ]
    },
    {
      slideNumber: 5,
      title: "TAM SAM SOM",
      headline: "Addressable Market Scale",
      stats: [
        { label: "TAM (India Fleet Software)", value: "₹1,500 Cr" },
        { label: "SAM (Maharashtra EV SaaS)", value: "₹180 Cr" },
        { label: "SOM (Pune Core Aggregator)", value: "₹4.2 Cr" }
      ]
    },
    {
      slideNumber: 6,
      title: "Competition",
      headline: "SaaS Aggregation vs. Physical Networks",
      points: [
        "Ather Grid and Tata Power own prime physical charger spots but focus on hardware.",
        "Our platform is asset-light software, playing an aggregator role to manage depots."
      ]
    },
    {
      slideNumber: 7,
      title: "Business Model",
      headline: "SaaS Subscriptions + Transaction Cuts",
      models: [
        { type: "Depot SaaS", price: "₹1,500/vehicle/mo", note: "B2B Subscription" },
        { type: "Payment Cut", price: "2.5% of utility bill", note: "Transaction processing cut" },
        { type: "Grid API", price: "₹85,000/month", note: "Enterprise utility licensing" }
      ]
    },
    {
      slideNumber: 8,
      title: "Financial Projections",
      headline: "Path to Profitability",
      stats: [
        { label: "Year 1 ARR", value: "$142K" },
        { label: "Year 3 ARR", value: "$1.42M" },
        { label: "Break-even Month", value: "Month 11" }
      ]
    },
    {
      slideNumber: 9,
      title: "Product Roadmap",
      headline: "Tactical Milestones",
      points: [
        "Month 1-3: Interview 30 fleet operators and deploy pricing validation landing page.",
        "Month 4-9: Onboard 5-vehicle pilot and release embedded OCPP firmware simulator.",
        "Month 10-18: Commercial multi-tenant SaaS release targeting Pune logistics hubs."
      ]
    },
    {
      slideNumber: 10,
      title: "Funding Ask",
      headline: "Raising ₹1.5 Crore Seed Capital",
      points: [
        "Provides 18-month operational runway.",
        "Core use: hiring lead embedded co-founder and West India sales managers.",
        "Deliverable target: Onboard 50 paid B2B accounts and secure OCPP network integrations."
      ]
    },
    {
      slideNumber: 11,
      title: "Why Now?",
      headline: "Subsidies & Grid Capacity Demands",
      points: [
        "Maharashtra offers subsidy incentives for smart load-shifting software developers.",
        "MSEDCL grid distribution limits restrict new physical charger permit applications."
      ]
    },
    {
      slideNumber: 12,
      title: "Closing",
      headline: "Decarbonizing Indian Fleet Logistics",
      points: [
        "Contact: founders@evfleetos.in",
        "Pune Office: Chakan Industrial Zone"
      ]
    }
  ],
  opportunityAnalysis: {
    title: "VentureIQ Strategic Opportunity Report",
    overallScore: 77,
    breakdown: {
      marketOpportunityScore: 85,
      competitionScore: 65,
      financialViabilityScore: 80,
      executionFeasibilityScore: 70,
      fundingPotentialScore: 75,
      riskResilienceScore: 72
    },
    keyFindings: [
      "Asset-light software aggregation model maintains low setup overhead under the ₹2 Lakhs limit.",
      "Surging local B2B EV logistics demand in Pune corridors creates direct sales pipelines.",
      "Land acquisition and grid connection costs are avoided by focusing on software layer management."
    ]
  },
  onePageBrief: {
    title: "VentureIQ One-Page Executive Brief",
    summary: "VentureIQ assesses the Pune EV charging network opportunity as a PROCEED WITH CAUTION investment. The dynamic OCPP load balancing software resolves grid capacity issues for B2B depots without land acquisitions. However, competitor real estate dominance from Ather and Tata Power forces the venture to win strictly on software value and efficiency rather than hardware scale.",
    keyMetrics: [
      { label: "TAM", value: "₹1,500 Cr" },
      { label: "Val. Runway", value: "₹2 Lakhs Savings" },
      { label: "LTV:CAC Ratio", value: "20x SaaS Gross" }
    ],
    recommendedActions: [
      "Onboard 5 pilot fleet operators for 2-week load reduction telemetry logs.",
      "Apply for SISFS grant of ₹20 Lakhs for DPIIT entity registration.",
      "Recruit embedded systems systems co-founder with OCPP firmware credentials."
    ]
  },
  charts: {
    marketGrowth: [
      { label: "2024", value: 120 },
      { label: "2026", value: 240 },
      { label: "2028", value: 580 },
      { label: "2030", value: 1500 }
    ],
    revenueForecast: [
      { label: "Year 1", value: 142000 },
      { label: "Year 2", value: 450000 },
      { label: "Year 3", value: 1420000 }
    ],
    costBreakdown: [
      { label: "Embedded Dev", value: 80000 },
      { label: "Pilots", value: 50000 },
      { label: "Hosting", value: 30000 },
      { label: "Operations", value: 40000 }
    ],
    riskMatrix: [
      { x: 30, y: 70, label: "Ather/Tata Competition", severity: "HIGH" },
      { x: 60, y: 50, label: "MSEDCL Grid Outages", severity: "MEDIUM" }
    ],
    competitorMatrix: [
      { name: "Tata Power", criteria: ["High foot", "Poor SaaS"], score: 65 },
      { name: "Our Platform", criteria: ["Smart balance", "Asset light"], score: 85 }
    ],
    roadmapTimeline: [
      { task: "Customer discovery", startMonth: 1, endMonth: 3, phase: "Validation" },
      { task: "MVP Load Pilot", startMonth: 4, endMonth: 9, phase: "MVP" }
    ]
  }
};
