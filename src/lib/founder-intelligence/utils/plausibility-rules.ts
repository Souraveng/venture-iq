// ──────────────────────────────────────────────────────────────────────────────
// Plausibility Rules Engine — Deterministic validation logic
// Used by Phase 3 (Rule-Based Validation)
// ──────────────────────────────────────────────────────────────────────────────

import type { ExtractedFact, ValidatedFact } from "../contracts";

interface PlausibilityBounds {
  tamMinB: number;
  tamMaxB: number;
  cagrMinPct: number;
  cagrMaxPct: number;
}

const DEFAULT_BOUNDS: PlausibilityBounds = {
  tamMinB: 0.1,    // $100M minimum
  tamMaxB: 2000,   // $2T maximum
  cagrMinPct: 1,
  cagrMaxPct: 80,
};

/**
 * Check if a numeric claim is plausible within sector bounds.
 */
function checkNumericPlausibility(
  fact: ExtractedFact,
  bounds: PlausibilityBounds
): { valid: boolean; reason?: string } {
  if (fact.value === undefined) return { valid: true };

  const unit = (fact.unit || "").toLowerCase();
  const claim = fact.claim.toLowerCase();

  // TAM checks
  if (claim.includes("tam") || claim.includes("total addressable market") || claim.includes("market size")) {
    if (unit.includes("billion") || unit.includes("b")) {
      if (fact.value > bounds.tamMaxB) {
        return { valid: false, reason: `TAM of $${fact.value}B exceeds plausible ceiling of $${bounds.tamMaxB}B` };
      }
      if (fact.value < bounds.tamMinB) {
        return { valid: false, reason: `TAM of $${fact.value}B is below minimum threshold of $${bounds.tamMinB}B` };
      }
    }
    if (unit.includes("trillion") || unit.includes("t")) {
      if (fact.value > 50) {
        return { valid: false, reason: `TAM of $${fact.value}T is implausibly large (>$50T)` };
      }
    }
  }

  // CAGR checks
  if (claim.includes("cagr") || claim.includes("growth rate") || claim.includes("growing at")) {
    if (unit === "%" || unit === "percent") {
      if (fact.value > bounds.cagrMaxPct) {
        return { valid: false, reason: `CAGR of ${fact.value}% exceeds plausible maximum of ${bounds.cagrMaxPct}%` };
      }
      if (fact.value < bounds.cagrMinPct) {
        return { valid: false, reason: `CAGR of ${fact.value}% is below plausible minimum of ${bounds.cagrMinPct}%` };
      }
    }
  }

  // Negative values for things that shouldn't be negative
  if (fact.value < 0 && (claim.includes("revenue") || claim.includes("users") || claim.includes("market"))) {
    return { valid: false, reason: `Negative value (${fact.value}) for a metric that should be non-negative` };
  }

  return { valid: true };
}

/**
 * Cross-source consensus: if multiple facts make similar claims,
 * boost their confidence.
 */
function checkConsensus(facts: ExtractedFact[]): Map<number, "confirmed" | "flagged"> {
  const statusMap = new Map<number, "confirmed" | "flagged">();

  // Group facts by rough topic (using simple keyword overlap)
  for (let i = 0; i < facts.length; i++) {
    const iWords = new Set(facts[i].claim.toLowerCase().split(/\s+/));
    let agreementCount = 0;

    for (let j = 0; j < facts.length; j++) {
      if (i === j) continue;
      const jWords = facts[j].claim.toLowerCase().split(/\s+/);
      const overlap = jWords.filter(w => iWords.has(w) && w.length > 3).length;
      if (overlap >= 2) agreementCount++;
    }

    // 2+ sources with overlapping claims = confirmed
    statusMap.set(i, agreementCount >= 2 ? "confirmed" : "flagged");
  }

  return statusMap;
}

/**
 * Validate all extracted facts using deterministic rules.
 * Returns ValidatedFact[] with validation status on each.
 */
export function validateFacts(
  facts: ExtractedFact[],
  sectorBounds?: { tamMinB: number; tamMaxB: number }
): ValidatedFact[] {
  const bounds: PlausibilityBounds = {
    ...DEFAULT_BOUNDS,
    ...(sectorBounds ? { tamMinB: sectorBounds.tamMinB, tamMaxB: sectorBounds.tamMaxB } : {}),
  };

  const consensus = checkConsensus(facts);

  return facts.map((fact, index) => {
    const plausibility = checkNumericPlausibility(fact, bounds);

    if (!plausibility.valid) {
      return {
        ...fact,
        validationStatus: "rejected" as const,
        flagReason: plausibility.reason,
      };
    }

    // Use consensus + original confidence to determine final status
    const consensusStatus = consensus.get(index) || "flagged";
    if (consensusStatus === "confirmed" || fact.confidence === "high") {
      return { ...fact, validationStatus: "confirmed" as const };
    }

    return {
      ...fact,
      validationStatus: "flagged" as const,
      flagReason: "Single-source claim, low consensus",
    };
  });
}
