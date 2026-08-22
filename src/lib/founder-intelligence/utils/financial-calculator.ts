// ──────────────────────────────────────────────────────────────────────────────
// Financial Calculator — Deterministic math functions
// TAM/SAM/SOM, unit economics, runway — LLMs never touch these numbers
// ──────────────────────────────────────────────────────────────────────────────

import type { FinancialCalculations, ValidatedFact } from "../contracts";

/**
 * Extract a numeric value from validated facts by keyword match.
 * Returns the first match, or the fallback.
 */
function extractNumber(facts: ValidatedFact[], keywords: string[], fallback: number): number {
  for (const fact of facts) {
    if (fact.value !== undefined && fact.validationStatus !== "rejected") {
      const claim = fact.claim.toLowerCase();
      if (keywords.some(kw => claim.includes(kw))) {
        return fact.value;
      }
    }
  }
  return fallback;
}

/**
 * Compute all financial metrics deterministically from extracted data.
 * The LLM NEVER does this math — it only narrates the results.
 */
export function computeFinancials(
  facts: ValidatedFact[],
  sectorDefaults: { tamMinB: number; tamMaxB: number }
): FinancialCalculations {
  // TAM: extract or use sector midpoint
  const tamB = extractNumber(facts, ["tam", "total addressable", "market size"], 
    (sectorDefaults.tamMinB + sectorDefaults.tamMaxB) / 2);

  // SAM: typically 10-30% of TAM
  const samPct = extractNumber(facts, ["sam", "serviceable addressable"], 20);
  const samB = tamB * (samPct / 100);

  // SOM: typically 1-5% of SAM for a startup
  const somPct = extractNumber(facts, ["som", "serviceable obtainable", "market share"], 3);
  const somM = samB * 1000 * (somPct / 100);

  // Unit Economics
  const cacUsd = extractNumber(facts, ["cac", "customer acquisition", "acquisition cost"], 150);
  const ltvUsd = extractNumber(facts, ["ltv", "lifetime value", "customer lifetime"], 600);
  const ltvCacRatio = cacUsd > 0 ? Math.round((ltvUsd / cacUsd) * 10) / 10 : 0;

  // Gross Margin
  const grossMarginPct = extractNumber(facts, ["gross margin", "margin"], 72);

  // Runway
  const monthlyBurnUsd = extractNumber(facts, ["burn", "monthly burn", "burn rate"], 25000);
  const seedFunding = extractNumber(facts, ["seed", "funding", "raised"], 500000);
  const runwayMonths = monthlyBurnUsd > 0 ? Math.round(seedFunding / monthlyBurnUsd) : 20;

  return {
    tamValueB: Math.round(tamB * 10) / 10,
    samValueB: Math.round(samB * 10) / 10,
    somValueM: Math.round(somM * 10) / 10,
    cacUsd: Math.round(cacUsd),
    ltvUsd: Math.round(ltvUsd),
    ltvCacRatio,
    monthlyBurnUsd: Math.round(monthlyBurnUsd),
    runwayMonths,
    grossMarginPct: Math.round(grossMarginPct),
  };
}

/**
 * Score the financial health 0-100 based on computed metrics.
 * Fully deterministic, auditable formula.
 */
export function scoreFinancials(calc: FinancialCalculations): number {
  let score = 50; // baseline

  // LTV/CAC ratio scoring
  if (calc.ltvCacRatio >= 4) score += 15;
  else if (calc.ltvCacRatio >= 3) score += 10;
  else if (calc.ltvCacRatio >= 2) score += 5;
  else if (calc.ltvCacRatio < 1) score -= 10;

  // Gross margin scoring
  if (calc.grossMarginPct >= 80) score += 15;
  else if (calc.grossMarginPct >= 60) score += 10;
  else if (calc.grossMarginPct >= 40) score += 5;
  else score -= 5;

  // Runway scoring
  if (calc.runwayMonths >= 24) score += 10;
  else if (calc.runwayMonths >= 18) score += 7;
  else if (calc.runwayMonths >= 12) score += 3;
  else score -= 5;

  // SOM scoring (addressable opportunity)
  if (calc.somValueM >= 100) score += 10;
  else if (calc.somValueM >= 50) score += 7;
  else if (calc.somValueM >= 10) score += 3;

  return Math.max(0, Math.min(100, score));
}
