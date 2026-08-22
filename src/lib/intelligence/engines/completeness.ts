import { EngineContext, createFinding } from "../types";

export function runCompletenessEngine(context: EngineContext): void {
  const { input, result } = context;

  const requiredInputCount = 9;
  const missingCount = input.missingFields.length;
  
  if (missingCount === 0) {
    result.findings.push(
      createFinding(
        "data-completeness",
        "Profile completeness",
        "All required foundational profile fields are present in this run snapshot. Values remain founder-provided until verified.",
        "NEEDS_REVIEW",
        0.6
      )
    );
  } else {
    result.findings.push(
      createFinding(
        "data-completeness",
        "Profile completeness",
        `${missingCount} required inputs are missing: ${input.missingFields.join(", ")}. No investment conclusion should be made from this profile alone.`,
        "INSUFFICIENT_EVIDENCE",
        1
      )
    );
  }

  // We add this worker to the completed set
  result.completedWorkerIds.push("data-completeness");
}
