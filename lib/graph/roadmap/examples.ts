// lib/graph/roadmap/examples.ts
import { FounderRoadmapReport } from "./types";

export const MOCK_ROADMAP_REPORT: FounderRoadmapReport = {
  "30DayPlan": [
    "Conduct interviews with 30 target business operators to catalog local scheduling and workflow bottlenecks.",
    "Set up a simple landing page explaining the optimization software and track visitor interest.",
    "Validate willingness-to-pay models with 15 operations managers (e.g., offering pilot pricing at ₹1,500/seat/month).",
    "Contact regulatory and industry experts to map compliance requirements and certification fees."
  ],
  "90DayPlan": [
    "Build the core software MVP, simulating workflow balancing and presenting task status in a web interface.",
    "Deploy a 2-week pilot with 5 live active users using the initial beta version of the software.",
    "Collect performance data from the pilot to verify efficiency gains (targeting >20% reduction in queue wait times).",
    "Acquire signed Letters of Intent (LOI) from 5 local business operators for commercial rollout."
  ],
  "1YearPlan": [
    "Commercialize the SaaS dashboard and onboard 50 paid client accounts in regional business hubs.",
    "Establish software API integrations with major third-party databases and enterprise tools.",
    "Hire a lead full-stack web developer and a dedicated regional sales lead.",
    "Close a ₹1.5 Crore ($180K USD) seed funding round from technology-focused angel networks."
  ],
  "validationRoadmap": [
    {
      "type": "customer_interview",
      "task": "Interview 30 business operations managers regarding daily scheduling bottlenecks.",
      "successMetric": "At least 20 confirm daily operations are regularly delayed by scheduling conflicts or resource constraints.",
      "failureCriteria": "Fewer than 10 owners identify scheduling as a top-3 operational pain point."
    },
    {
      "type": "landing_page",
      "task": "Launch an online cost-saving calculator demonstrating SaaS ROI based on workload optimization.",
      "successMetric": "A landing page conversion (email signups or calculator completions) rate greater than 8%.",
      "failureCriteria": "Visitor signup conversion rate falls below 3% after 200 targeted visits."
    },
    {
      "type": "pricing_test",
      "task": "Propose a B2B subscription model of ₹1,500 per seat per month to 15 pilot candidates.",
      "successMetric": "At least 5 operations managers sign pilot LOIs agreeing to subscription pricing upon successful proof of value.",
      "failureCriteria": "Zero managers sign, citing preference for traditional custom software models."
    },
    {
      "type": "pilot_program",
      "task": "Execute a live 2-week validation pilot with 5 users.",
      "successMetric": "Workflow telemetry shows peak demand queues drop by >20% without increasing average execution durations.",
      "failureCriteria": "The scheduling algorithm results in delayed deliveries or system crashes."
    }
  ],
  "goToMarketPlan": {
    "customerAcquisitionStrategy": "Direct sales outreach to local SME operators and cooperatives, offering free 2-week pilots to demonstrate direct cost savings.",
    "channels": [
      "Direct Sales Outreach",
      "Regional SME Business Forums",
      "Strategic partnerships with software providers",
      "Tech and enterprise management exhibitions"
    ],
    "partnerships": [
      "Regional Business Owners Association",
      "Local software distributors looking for integration plugins",
      "Consultants specializing in operational restructuring"
    ],
    "marketing": [
      "ROI cost-reduction calculator tools",
      "Email marketing targeted at business supervisors",
      "LinkedIn thought-leadership content sharing pilot success data"
    ],
    "sales": [
      "On-site pilot presentations",
      "Value-based pricing showing ROI under 6 months"
    ],
    "distribution": [
      "Web-based dashboard client portal",
      "Over-the-air software updates via secure cloud deployments"
    ]
  },
  "fundraisingRoadmap": {
    "bootstrapStage": [
      "Utilize the initial ₹2 Lakhs founder savings to build the landing page, register the entity, and cover travel/pilot costs."
    ],
    "grantStage": [
      "Apply for the Startup India Seed Fund Scheme (SISFS) for up to ₹20 Lakhs in non-dilutive validation grants.",
      "Apply for regional innovation grants supporting technology prototyping."
    ],
    "angelStage": [
      "Raise ₹50 Lakhs from angel networks based on validated pilot metrics."
    ],
    "seedStage": [
      "Secure a ₹1.5 Crore ($180K USD) institutional seed round to expand engineering staff and roll out services to other cities."
    ],
    "requirements": {
      "bootstrap": [
        "Validated problem definition",
        "Registered domain and landing page live"
      ],
      "grant": [
        "Registered private limited entity in India",
        "DPIIT recognition certificate"
      ],
      "angel": [
        "MVP complete",
        "5 active pilot users with logged performance data",
        "3 letters of intent for commercial contracts"
      ],
      "seed": [
        "₹3 Lakhs MRR achieved",
        "Verified software integration with 2 major networks"
      ]
    }
  },
  "hiringRoadmap": [
    {
      "role": "Technical Co-Founder / Systems Engineer",
      "priority": 1,
      "department": "Engineering",
      "timeline": "Month 1–2",
      "justification": "Core software integration requires full-time ownership of algorithm and protocol implementations."
    },
    {
      "role": "B2B Sales Representative",
      "priority": 2,
      "department": "Sales",
      "timeline": "Month 3–4",
      "justification": "Required to execute sales outreach and pilot recruitment with business managers."
    },
    {
      "role": "Full-Stack Web Developer",
      "priority": 3,
      "department": "Engineering",
      "timeline": "Month 5–6",
      "justification": "Needed to transition the pilot dashboard into a scalable, multi-tenant B2B SaaS platform."
    }
  ],
  "milestones": [
    {
      "id": "ms-1",
      "goal": "Complete Customer Discovery",
      "successCriteria": "30 interviews with operators completed, validating scheduling as a primary pain point.",
      "timeline": "Phase 1: Validation (Months 1–3)",
      "priority": "HIGH",
      "dependencies": []
    },
    {
      "id": "ms-2",
      "goal": "Launch Pricing & Landing Page Validation",
      "successCriteria": "Website live with >8% calculator completion rate and 5 pilot letters of intent signed.",
      "timeline": "Phase 1: Validation (Months 1–3)",
      "priority": "HIGH",
      "dependencies": ["ms-1"]
    },
    {
      "id": "ms-3",
      "goal": "Deploy Software Optimization Pilot",
      "successCriteria": "Telemetry validation from 5 pilot instances showing 20% queue reduction without delaying runs.",
      "timeline": "Phase 2: MVP (Months 4–9)",
      "priority": "HIGH",
      "dependencies": ["ms-2"]
    },
    {
      "id": "ms-4",
      "goal": "Commercial SaaS Launch",
      "successCriteria": "First 20 paid B2B customers onboarded at ₹1,500/seat/month subscription.",
      "timeline": "Phase 3: Growth (Months 10–18)",
      "priority": "HIGH",
      "dependencies": ["ms-3"]
    },
    {
      "id": "ms-5",
      "goal": "Institutional Seed Round Closure",
      "successCriteria": "₹1.5 Crore seed capital secured in bank account.",
      "timeline": "Phase 4: Fundraising (Months 16–20)",
      "priority": "MEDIUM",
      "dependencies": ["ms-4"]
    }
  ],
  "priorityMatrix": {
    "highImpactLowEffort": [
      "Launch a cost-saving ROI calculator on the website landing page.",
      "Conduct interviews with regional business cooperatives.",
      "Apply for state innovation grants."
    ],
    "highImpactHighEffort": [
      "Build the workflow balancing simulation dashboard.",
      "Negotiate API access with major enterprise databases.",
      "Design a multi-tenant database for client profile security."
    ],
    "lowImpactLowEffort": [
      "Incorporate the legal business entity.",
      "Set up official company profiles on LinkedIn."
    ],
    "lowImpactHighEffort": [
      "Apply for early ISO 27001 data security compliance certifications.",
      "Develop custom native offline-first mobile apps for field staff."
    ]
  },
  "keySuccessFactors": [
    "Stable software database integrations across diverse platforms.",
    "Convincing budget-tight operators that optimization delivers a clear return on subscription fees.",
    "Navigating regulatory permissions and local licensing policies."
  ]
};
