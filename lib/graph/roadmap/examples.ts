// lib/graph/roadmap/examples.ts
import { FounderRoadmapReport } from "./types";

export const MOCK_ROADMAP_REPORT: FounderRoadmapReport = {
  "30DayPlan": [
    "Conduct interviews with 30 Pune e-rickshaw and logistics fleet operators to catalog local charging bottlenecks.",
    "Set up a simple landing page explaining the load-balancing charging software and track visitor interest.",
    "Validate willingness-to-pay models with 15 logistics managers in Pune (e.g., offering pilot pricing at ₹1,500/vehicle/month).",
    "Contact MSEDCL (Maharashtra State Electricity Distribution Company) to map grid connection processes and fees in Pune suburbs."
  ],
  "90DayPlan": [
    "Build the core software MVP, simulating grid load balancing and presenting charger status in a web interface.",
    "Deploy a 2-week pilot with 5 live e-rickshaws using existing Pune-based charging infrastructure.",
    "Collect telemetry data from the pilot to verify load reduction metrics (targeting >20% reduction in peak draw).",
    "Acquire signed Letters of Intent (LOI) from 5 local fleet operators for commercial rollout."
  ],
  "1YearPlan": [
    "Commercialize the SaaS dashboard and onboard 50 paid fleet customers in Pune/Pimpri-Chinchwad.",
    "Establish software API integrations with Ather Grid and Tata Power charging networks via OCPP protocols.",
    "Hire a lead embedded systems engineer and a dedicated West India sales lead.",
    "Close a ₹1.5 Crore ($180K USD) seed funding round from cleantech-focused angel networks."
  ],
  "validationRoadmap": [
    {
      "type": "customer_interview",
      "task": "Interview 30 logistics fleet owners in industrial Pune areas (Chakan, Bhosari) regarding daily charging schedules.",
      "successMetric": "At least 20 confirm daily operations are regularly delayed by lack of available fast chargers or grid outages.",
      "failureCriteria": "Fewer than 10 owners identify charger availability as a top-3 operational pain point."
    },
    {
      "type": "landing_page",
      "task": "Launch an online cost-saving calculator demonstrating SaaS ROI based on charging load balancing.",
      "successMetric": "A landing page conversion (email signups or calculator completions) rate greater than 8%.",
      "failureCriteria": "Visitor signup conversion rate falls below 3% after 200 targeted visits."
    },
    {
      "type": "pricing_test",
      "task": "Propose a B2B subscription model of ₹1,500 per vehicle per month to 15 pilot candidates.",
      "successMetric": "At least 5 fleet managers sign pilot LOIs agreeing to subscription pricing upon successful proof of value.",
      "failureCriteria": "Zero managers sign, citing preference for capital expenditure (hardware-only) models."
    },
    {
      "type": "pilot_program",
      "task": "Execute a live 2-week validation pilot with 5 vehicles.",
      "successMetric": "Grid telemetry shows peak power demands drop by >20% without increasing average charging duration.",
      "failureCriteria": "The scheduling algorithm results in delayed deliveries or grid overloads."
    }
  ],
  "goToMarketPlan": {
    "customerAcquisitionStrategy": "Direct sales outreach to local SME logistics operators and e-rickshaw cooperatives in Pune, offering free 2-week pilots to demonstrate direct electricity bill savings.",
    "channels": [
      "Direct Sales Outreach",
      "Pune SME Logistics Forums",
      "Strategic partnerships with EV manufacturers",
      "Clean-tech and mobility exhibitions in Maharashtra"
    ],
    "partnerships": [
      "Pune Electric Vehicle Dealers Association",
      "Local charging hardware manufacturers looking for software integrations",
      "Hub landlords at transport intersections"
    ],
    "marketing": [
      "ROI cost-reduction calculator tools",
      "Email marketing targeted at fleet logistics supervisors",
      "LinkedIn thought-leadership content sharing pilot success data"
    ],
    "sales": [
      "On-site pilot presentations",
      "Value-based pricing showing ROI under 6 months"
    ],
    "distribution": [
      "Web-based dashboard client portal",
      "Over-the-air firmware updates via OCPP 1.6/2.0.1 integrations"
    ]
  },
  "fundraisingRoadmap": {
    "bootstrapStage": [
      "Utilize the initial ₹2 Lakhs founder savings to build the landing page, register the entity, and cover local travel/pilot costs."
    ],
    "grantStage": [
      "Apply for the Startup India Seed Fund Scheme (SISFS) for up to ₹20 Lakhs in non-dilutive validation grants.",
      "Apply for DST NIDHI-PRAYAS grant supporting hardware/firmware prototyping."
    ],
    "angelStage": [
      "Raise ₹50 Lakhs from Pune/Mumbai angel networks (e.g., Lead Angels, Venture Catalysts) based on validated pilot metrics."
    ],
    "seedStage": [
      "Secure a ₹1.5 Crore ($180K USD) institutional seed round to expand engineering staff and roll out services to Mumbai."
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
        "Verified software integration with 2 major charging networks"
      ]
    }
  },
  "hiringRoadmap": [
    {
      "role": "Technical Co-Founder / Embedded Software Engineer",
      "priority": 1,
      "department": "Engineering",
      "timeline": "Month 1–2",
      "justification": "Core software integration with chargers requires full-time ownership of OCPP protocol implementations."
    },
    {
      "role": "B2B Sales Representative (West India)",
      "priority": 2,
      "department": "Sales",
      "timeline": "Month 3–4",
      "justification": "Required to execute door-to-door sales and pilot recruitment with Pune logistics fleet managers."
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
      "goal": "Complete Customer Discovery in Pune",
      "successCriteria": "30 interviews with fleet operators completed, validating grid load as a primary pain point.",
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
      "goal": "Deploy Software Load Balancing Pilot",
      "successCriteria": "Telemetry validation from 5 pilot vehicles showing 20% peak demand reduction without delaying runs.",
      "timeline": "Phase 2: MVP (Months 4–9)",
      "priority": "HIGH",
      "dependencies": ["ms-2"]
    },
    {
      "id": "ms-4",
      "goal": "Commercial SaaS Launch",
      "successCriteria": "First 20 paid B2B fleet customers onboarded at ₹1,500/vehicle/month subscription.",
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
      "Launch a load-saving ROI calculator on the website landing page.",
      "Conduct interviews with Pune e-rickshaw cooperatives.",
      "Apply for Maharashtra state EV innovation grants."
    ],
    "highImpactHighEffort": [
      "Build the grid load balancing firmware simulator dashboard.",
      "Negotiate OCPP API access with Ather Grid and Tata Power.",
      "Design a multi-tenant database for fleet profile security."
    ],
    "lowImpactLowEffort": [
      "Incorporate the legal business entity.",
      "Set up official company profiles on LinkedIn."
    ],
    "lowImpactHighEffort": [
      "Apply for early ISO 27001 data security compliance certifications.",
      "Develop custom native offline-first mobile apps for fleet drivers."
    ]
  },
  "keySuccessFactors": [
    "Stable OCPP hardware communications across diverse charging stations in Pune.",
    "Convincing budget-tight fleet operators that load optimization delivers a clear return on subscription fees.",
    "Navigating regulatory permissions and utility load policies with MSEDCL."
  ]
};
