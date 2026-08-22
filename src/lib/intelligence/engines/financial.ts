import { EngineContext, createFinding } from "../types";

export function parseAmount(value: string | null): number | null {
  if (!value || value.trim() === "" || value.trim() === "0") return null;
  const numeric = Number.parseFloat(value.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/)?.[0] ?? "");
  if (!Number.isFinite(numeric)) return null;

  const normalized = value.toLowerCase();
  if (/\bcr(?:ore)?s?\b/.test(normalized)) return numeric * 10_000_000;
  if (/\blakh?s?\b/.test(normalized)) return numeric * 100_000;
  if (/\b(?:m|mn|million)\b/.test(normalized)) return numeric * 1_000_000;
  if (/\b(?:k|thousand)\b/.test(normalized)) return numeric * 1_000;
  return numeric;
}

export function runFinancialEngine(context: EngineContext): void {
  const { input, result } = context;
  const activeStartup = { ...input.startup, ...(input.scenarioOverrides || {}) };
  const revenue = parseAmount(activeStartup.monthlyRevenue);
  const burn = parseAmount(activeStartup.monthlyBurn);

  if (revenue !== null && burn !== null) {
    const operatingDelta = revenue - burn;
    result.findings.push(
      createFinding(
        "financial-intelligence",
        "Founder-provided operating profile",
        `The submitted monthly revenue and burn imply an operating delta of ${operatingDelta >= 0 ? "positive" : "negative"} ${Math.abs(operatingDelta).toLocaleString()}. This deterministic calculation requires document verification before investment use.`,
        "NEEDS_REVIEW",
        0.6
      )
    );
  } else {
    result.findings.push(
      createFinding(
        "financial-intelligence",
        "Financial input gap",
        "Monthly revenue and monthly burn are both required to calculate an operating profile. Financial conclusions and runway estimates are unavailable.",
        "INSUFFICIENT_EVIDENCE",
        null
      )
    );
  }

  result.completedWorkerIds.push("financial-intelligence");
}
