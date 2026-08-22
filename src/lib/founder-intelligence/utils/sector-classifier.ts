// ──────────────────────────────────────────────────────────────────────────────
// Sector Classifier — Deterministic keyword → sector/geography mapping
// Used by Phase 0 (Input Validation) to select the right playbook
// ──────────────────────────────────────────────────────────────────────────────

import { PlaybookConfig } from "../contracts";

const SECTOR_KEYWORDS: Record<string, string[]> = {
  fintech: ["fintech", "payment", "banking", "lending", "insurance", "neobank", "wallet", "upi", "credit", "debit", "financial", "money transfer", "investment platform"],
  healthtech: ["health", "medical", "hospital", "telemedicine", "pharma", "drug", "diagnostic", "wellness", "fitness", "mental health", "patient", "doctor", "clinic"],
  edtech: ["education", "learning", "school", "university", "tutoring", "course", "e-learning", "lms", "student", "teacher", "classroom", "skill"],
  ecommerce: ["ecommerce", "e-commerce", "marketplace", "shop", "retail", "d2c", "direct to consumer", "store", "delivery", "shopping", "cart"],
  saas: ["saas", "software", "platform", "tool", "b2b", "enterprise", "crm", "erp", "automation", "workflow", "dashboard", "analytics"],
  mobility: ["electric vehicle", "ev", "ride", "transport", "logistics", "fleet", "scooter", "bike", "car", "delivery", "last mile", "autonomous"],
  foodtech: ["food", "restaurant", "kitchen", "recipe", "meal", "grocery", "chef", "dining", "catering", "inventory management"],
  proptech: ["real estate", "property", "housing", "rent", "construction", "architecture", "building", "home"],
  agritech: ["agriculture", "farming", "crop", "soil", "irrigation", "harvest", "livestock", "dairy"],
  cleantech: ["solar", "wind", "renewable", "energy", "carbon", "sustainability", "clean", "green", "climate"],
};

const GEOGRAPHY_KEYWORDS: Record<string, string[]> = {
  india: ["india", "indian", "delhi", "mumbai", "bangalore", "bengaluru", "hyderabad", "chennai", "kolkata", "tier 1", "tier 2", "rupee", "inr", "₹"],
  sea: ["south-east asia", "southeast asia", "sea", "singapore", "indonesia", "vietnam", "thailand", "malaysia", "philippines"],
  us: ["united states", "us", "usa", "america", "silicon valley", "new york", "san francisco", "usd", "$"],
  europe: ["europe", "eu", "uk", "germany", "france", "london", "berlin", "gdpr"],
  africa: ["africa", "nigeria", "kenya", "south africa", "lagos", "nairobi"],
  mena: ["middle east", "mena", "dubai", "saudi", "uae", "qatar"],
  global: [], // default fallback
};

const PLAYBOOK_DEFAULTS: Record<string, Omit<PlaybookConfig, "sector" | "geography" | "searchQueryTemplates">> = {
  fintech:    { tamBenchmarks: { minB: 5, maxB: 500 }, regulatoryKeywords: ["RBI", "SEC", "PCI-DSS", "KYC", "AML", "GDPR"] },
  healthtech: { tamBenchmarks: { minB: 10, maxB: 800 }, regulatoryKeywords: ["FDA", "HIPAA", "CE Mark", "CDSCO", "clinical trial"] },
  edtech:     { tamBenchmarks: { minB: 3, maxB: 400 }, regulatoryKeywords: ["accreditation", "FERPA", "UGC", "NEP"] },
  ecommerce:  { tamBenchmarks: { minB: 10, maxB: 2000 }, regulatoryKeywords: ["consumer protection", "FDI", "GST", "import duty"] },
  saas:       { tamBenchmarks: { minB: 5, maxB: 800 }, regulatoryKeywords: ["SOC2", "GDPR", "data residency", "CCPA"] },
  mobility:   { tamBenchmarks: { minB: 20, maxB: 1500 }, regulatoryKeywords: ["emission", "FAME", "PLI", "safety certification"] },
  foodtech:   { tamBenchmarks: { minB: 5, maxB: 600 }, regulatoryKeywords: ["FSSAI", "FDA", "food safety", "HACCP"] },
  proptech:   { tamBenchmarks: { minB: 10, maxB: 1000 }, regulatoryKeywords: ["RERA", "zoning", "building code", "land acquisition"] },
  agritech:   { tamBenchmarks: { minB: 3, maxB: 500 }, regulatoryKeywords: ["APMC", "MSP", "organic certification", "pesticide"] },
  cleantech:  { tamBenchmarks: { minB: 15, maxB: 2000 }, regulatoryKeywords: ["carbon credit", "renewable policy", "grid parity", "EPA"] },
};

const DEFAULT_PLAYBOOK: Omit<PlaybookConfig, "sector" | "geography" | "searchQueryTemplates"> = {
  tamBenchmarks: { minB: 5, maxB: 1000 },
  regulatoryKeywords: ["compliance", "regulation", "certification"],
};

/**
 * Classify sector from free-text idea.
 * Returns the best-matching sector or "general" if no strong match.
 */
export function classifySector(idea: string): string {
  // Check if there is an explicit "Industry: XXX" line
  const industryMatch = idea.match(/Industry:\s*(.+)/i);
  if (industryMatch && industryMatch[1]) {
    const rawIndustry = industryMatch[1].trim().toLowerCase();
    for (const sector of Object.keys(SECTOR_KEYWORDS)) {
      if (rawIndustry.includes(sector) || sector.includes(rawIndustry)) {
        return sector;
      }
    }
  }

  const lower = idea.toLowerCase();
  let bestSector = "general";
  let bestCount = 0;

  for (const [sector, keywords] of Object.entries(SECTOR_KEYWORDS)) {
    const count = keywords.filter((kw) => lower.includes(kw)).length;
    if (count > bestCount) {
      bestCount = count;
      bestSector = sector;
    }
  }

  return bestSector;
}

/**
 * Classify geography from free-text idea.
 * Returns the best-matching geography or "global" if no strong match.
 */
export function classifyGeography(idea: string): string {
  // Check if there is an explicit "Geography: XXX" line
  const geoMatch = idea.match(/Geography:\s*(.+)/i);
  if (geoMatch && geoMatch[1]) {
    const rawGeo = geoMatch[1].trim().toLowerCase();
    for (const geo of Object.keys(GEOGRAPHY_KEYWORDS)) {
      if (geo === "global") continue;
      if (rawGeo.includes(geo) || geo.includes(rawGeo)) {
        return geo;
      }
    }
    return rawGeo; // Allow custom geography names like "brazil", "germany" etc.
  }

  const lower = idea.toLowerCase();
  let bestGeo = "global";
  let bestCount = 0;

  for (const [geo, keywords] of Object.entries(GEOGRAPHY_KEYWORDS)) {
    if (geo === "global") continue;
    const count = keywords.filter((kw) => lower.includes(kw)).length;
    if (count > bestCount) {
      bestCount = count;
      bestGeo = geo;
    }
  }

  return bestGeo;
}

/**
 * Build a PlaybookConfig from the classified sector + geography.
 */
export function buildPlaybook(sector: string, geography: string, idea: string): PlaybookConfig {
  const defaults = PLAYBOOK_DEFAULTS[sector] || DEFAULT_PLAYBOOK;

  // Generate search query templates based on sector + geography
  const searchQueryTemplates = [
    `${idea} market size TAM ${geography}`,
    `${idea} competitors startups ${geography}`,
    `${idea} regulatory compliance ${geography}`,
    `${sector} industry trends ${new Date().getFullYear()} ${geography}`,
    `${idea} customer acquisition cost unit economics`,
  ];

  return {
    sector,
    geography,
    searchQueryTemplates,
    ...defaults,
  };
}
